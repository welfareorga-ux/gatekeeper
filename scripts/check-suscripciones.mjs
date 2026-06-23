// Cruza la DB contra Culqi: detecta condominios cuya suscripción figura
// "cancelada"/"vencida" en nuestra base pero SIGUE VIVA en Culqi (y por tanto
// se le sigue cobrando). Solo lectura: no modifica nada.
//
//   node --env-file=.env scripts/check-suscripciones.mjs
import pg from "pg";

const DATABASE_URL = process.env.DATABASE_URL;
const CULQI_SECRET_KEY = process.env.CULQI_SECRET_KEY;
if (!DATABASE_URL || !CULQI_SECRET_KEY) {
  console.error("Falta DATABASE_URL o CULQI_SECRET_KEY en el entorno (.env).");
  process.exit(1);
}

const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();

const condos = (await client.query(`
  SELECT id, nombre, plan, activo, "suscripcionEstado", "culqiSubscriptionId"
  FROM "Condominio"
  WHERE "culqiSubscriptionId" IS NOT NULL
  ORDER BY "createdAt"
`)).rows;

// Culqi considera "viva" una suscripción que NO está en estado eliminado/cancelado.
// status numérico Culqi: 1=activa, 2=en proceso, 3=cancelada/eliminada (varía por doc),
// por eso evaluamos por presencia + ausencia de marca de baja.
async function estadoCulqi(subId) {
  const res = await fetch(`https://api.culqi.com/v2/recurrent/subscriptions/${subId}`, {
    headers: { Authorization: `Bearer ${CULQI_SECRET_KEY}` },
  });
  const body = await res.json().catch(() => ({}));
  if (res.status === 404) return { viva: false, detalle: "no existe (404)" };
  if (!res.ok) return { viva: null, detalle: `error ${res.status}: ${body?.merchant_message ?? body?.user_message ?? ""}` };
  // Una suscripción cancelada en Culqi responde 404 o con object:"deleted".
  // Si responde con objeto vivo y tiene next_billing_date futura, SIGUE cobrando.
  // (El campo `status` numérico NO sirve para detectar baja: status=3 es una sub viva.)
  const eliminada = body?.object === "deleted" || body?.deleted === true;
  const nextDate = body?.next_billing_date ?? body?.current_period_end ?? body?.billing_date ?? null;
  const futura = nextDate ? nextDate * 1000 > Date.now() : false;
  return {
    viva: !eliminada,
    detalle: `status=${body?.status ?? "?"}${nextDate ? ` · próx. cobro=${new Date(nextDate * 1000).toLocaleDateString("es-PE")}${futura ? " (PENDIENTE)" : ""}` : ""}`,
  };
}

const problemas = [];
console.log(`\nRevisando ${condos.length} condominio(s) con suscripción Culqi…\n`);

for (const c of condos) {
  const { viva, detalle } = await estadoCulqi(c.culqiSubscriptionId);
  const dbCancelada = c.suscripcionEstado === "cancelada" || c.suscripcionEstado === "vencida";
  const marca = viva && dbCancelada ? "  ⚠️  SIGUE COBRANDO" : "";
  console.log(`• ${c.nombre} [${c.suscripcionEstado}] sub=${c.culqiSubscriptionId} → Culqi: ${viva === null ? "??" : viva ? "VIVA" : "dada de baja"} (${detalle})${marca}`);
  if (viva && dbCancelada) problemas.push(c);
}

console.log("\n────────────────────────────────");
if (problemas.length === 0) {
  console.log("✅ Ningún condominio 'cancelada/vencida' tiene suscripción viva en Culqi.");
} else {
  console.log(`⚠️  ${problemas.length} condominio(s) figuran cancelados pero SIGUEN cobrándose en Culqi:`);
  for (const c of problemas) console.log(`   - ${c.nombre} (sub ${c.culqiSubscriptionId}) → cancelar en el panel de Culqi`);
}

await client.end();
