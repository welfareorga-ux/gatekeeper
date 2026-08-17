import type { Guia } from "./tipos"

export const guiasOperacion: Guia[] = [
  {
    slug: "control-de-visitas-en-condominios",
    titulo: "Cómo organizar el control de visitas en un condominio",
    resumen:
      "Guía práctica para ordenar quién entra, quién autoriza y qué queda registrado en un condominio con vigilancia, sin convertir la puerta en un cuello de botella.",
    categoria: "Operación diaria",
    minutos: 8,
    actualizado: "2026-08-16",
    bloques: [
      {
        tipo: "parrafo",
        texto:
          "En casi todos los condominios el control de visitas nació de la misma forma: alguien compró un cuaderno, lo dejó en la garita y pidió que apuntaran a los que entran. Funciona mientras el edificio es pequeño y todos se conocen. Deja de funcionar el día en que hay dos torres, cuarenta departamentos, tres turnos de vigilancia y un sábado con mudanza, cumpleaños y delivery a la vez.",
      },
      {
        tipo: "parrafo",
        texto:
          "Ordenar el control de visitas no es comprar un sistema. Es decidir tres cosas y escribirlas: quién puede autorizar una entrada, qué se le pide a quien llega y qué queda registrado. Si esas tres decisiones no están tomadas, ningún software las va a tomar por ti.",
      },
      { tipo: "subtitulo", texto: "1. Define quién autoriza" },
      {
        tipo: "parrafo",
        texto:
          "La pregunta que más discusiones genera en la puerta no es «¿quién eres?», sino «¿quién dijo que podías entrar?». Conviene dejar por escrito, en el reglamento interno, qué categorías de personas pueden autorizar el ingreso de un tercero.",
      },
      {
        tipo: "lista",
        items: [
          "El propietario o el inquilino registrado de la unidad. Es el caso normal y debería resolverse sin intervención de nadie más.",
          "Un residente adulto de la misma unidad, cuando el titular no está. Si no se acepta, hay que decirlo antes, no en la puerta un domingo.",
          "La administración, para proveedores y personal de mantenimiento contratado por el condominio.",
          "Nadie más. Ni el vigilante por criterio propio, ni un vecino a favor de otra unidad.",
        ],
      },
      {
        tipo: "parrafo",
        texto:
          "El punto no es ser restrictivo, es ser previsible. Un vigilante que sabe exactamente quién puede autorizar deja de improvisar, y el residente deja de sentir que la regla cambia según quién esté de turno.",
      },
      { tipo: "subtitulo", texto: "2. Decide qué se le pide a la visita" },
      {
        tipo: "parrafo",
        texto:
          "Aquí la tentación es pedir todo: nombre, documento, foto del DNI, placa, motivo, teléfono. Cada dato extra tiene un costo doble: alarga la cola en la puerta y aumenta tu responsabilidad legal sobre información que después tienes que custodiar.",
      },
      {
        tipo: "parrafo",
        texto:
          "Un criterio útil es preguntarse, dato por dato: si mañana tuviera que explicar por qué guardo esto, ¿tendría una respuesta concreta? El nombre y la unidad de destino casi siempre la tienen. La placa, en un condominio con estacionamiento de visitas, también. La foto del documento de identidad, guardada indefinidamente, rara vez.",
      },
      {
        tipo: "tabla",
        encabezados: ["Dato", "Para qué sirve de verdad", "Cuánto conviene conservarlo"],
        filas: [
          ["Nombre de la visita", "Identificar quién estuvo si hay un incidente", "Mientras tenga utilidad operativa"],
          ["Unidad de destino", "Saber a quién avisar y quién autorizó", "Igual que el anterior"],
          ["Placa del vehículo", "Control del estacionamiento de visitas", "Corto: se resuelve en el día"],
          ["Documento de identidad", "Verificación puntual en la puerta", "Verificar sin necesidad de archivar copia"],
          ["Motivo de la visita", "Casi nada, salvo proveedores", "Normalmente no hace falta"],
        ],
      },
      { tipo: "subtitulo", texto: "3. Define qué queda registrado" },
      {
        tipo: "parrafo",
        texto:
          "Un registro sirve para responder preguntas después: ¿quién entró el sábado entre las 8 y las 11 de la noche?, ¿esta persona ya había venido antes?, ¿quién autorizó el ingreso del técnico que dejó la puerta del sótano abierta? Si tu registro no puede responder eso en menos de un minuto, es un archivo, no un registro.",
      },
      {
        tipo: "parrafo",
        texto:
          "Ese es exactamente el punto donde el cuaderno se queda corto: la información está, pero recuperarla exige que alguien pase páginas. Y cuando la letra es del vigilante del turno de noche de hace tres semanas, muchas veces ni eso.",
      },
      { tipo: "subtitulo", texto: "El orden de implementación que menos fricción genera" },
      {
        tipo: "numerada",
        items: [
          "Escribe las reglas actuales, aunque sean imperfectas. No se puede mejorar lo que no está escrito.",
          "Preséntalas a la junta de propietarios y consigue que se aprueben. Sin respaldo formal, el vigilante queda solo frente al residente molesto.",
          "Comunica a los residentes con ejemplos concretos, no con el reglamento completo. «Si tu visita llega y no avisaste, te llamamos» se entiende; un artículo numerado no.",
          "Recién entonces digitaliza. Automatizar un proceso que nadie tiene claro solo reparte el desorden más rápido.",
        ],
      },
      {
        tipo: "nota",
        texto:
          "Un error frecuente: empezar por el paso 4. El sistema se instala, el vigilante lo usa a medias porque nadie definió los casos raros, y a los dos meses vuelve el cuaderno como respaldo. Cuando conviven cuaderno y sistema, ninguno de los dos es confiable.",
      },
      { tipo: "subtitulo", texto: "Qué mejora cuando esto está ordenado" },
      {
        tipo: "parrafo",
        texto:
          "El cambio más visible no es la seguridad, es el clima. Las discusiones en la puerta bajan porque la regla es la misma para todos y no depende del turno. El vigilante deja de ser el que decide y pasa a ser el que aplica, que es un rol mucho más defendible. Y la administración, cuando hay un incidente, puede contestar con datos en vez de con versiones.",
      },
      {
        tipo: "parrafo",
        texto:
          "La seguridad mejora también, pero de forma menos épica de lo que se suele vender: no porque se detenga a un delincuente en la puerta, sino porque desaparecen los accesos que nadie recuerda haber autorizado.",
      },
    ],
  },

  {
    slug: "cuaderno-de-visitas-por-que-falla",
    titulo: "Por qué el cuaderno de la garita falla (y qué se pierde con él)",
    resumen:
      "El cuaderno de visitas parece suficiente hasta el día que necesitas buscar algo en él. Analizamos sus cinco fallos típicos y qué riesgos concretos generan.",
    categoria: "Operación diaria",
    minutos: 6,
    actualizado: "2026-08-16",
    bloques: [
      {
        tipo: "parrafo",
        texto:
          "El cuaderno de la garita tiene una virtud enorme: nunca se cae, no necesita clave y cualquiera sabe usarlo. Por eso sobrevive. Vale la pena entender por qué falla, porque los fallos no son de papel contra pantalla, sino de cómo se comporta la información cuando hay prisa.",
      },
      { tipo: "subtitulo", texto: "Fallo 1: se escribe cuando hay tiempo, no cuando pasa" },
      {
        tipo: "parrafo",
        texto:
          "En la práctica el vigilante anota después: cuando pasaron los tres autos, cuando terminó de abrir la reja, cuando el residente dejó de reclamar. La hora que queda escrita es la hora en que tuvo un momento, no la hora del ingreso. Esa diferencia parece menor hasta que se necesita reconstruir una secuencia.",
      },
      { tipo: "subtitulo", texto: "Fallo 2: es un registro de escritura, no de consulta" },
      {
        tipo: "parrafo",
        texto:
          "Anotar cuesta segundos; buscar cuesta media hora. Un cuaderno no responde «¿cuántas veces entró esta camioneta este mes?» sin que alguien revise página por página. Como consultarlo es caro, en la práctica no se consulta, y un registro que no se consulta no cumple ninguna función salvo la simbólica.",
      },
      { tipo: "subtitulo", texto: "Fallo 3: la información muere en el cambio de turno" },
      {
        tipo: "parrafo",
        texto:
          "«El técnico del ascensor sigue adentro» es un dato que vive en la cabeza del vigilante que sale, no en el cuaderno. Si el relevo es apurado —y suele serlo—, el turno entrante empieza sin saber quién está dentro del condominio. Es el momento con más pérdida de información del día.",
      },
      { tipo: "subtitulo", texto: "Fallo 4: no distingue lo autorizado de lo consumado" },
      {
        tipo: "parrafo",
        texto:
          "El cuaderno registra que alguien entró. No registra que el residente lo había autorizado antes, ni que se le avisó, ni si la visita se fue. La pregunta incómoda después de un incidente casi nunca es «¿entró?», sino «¿quién dijo que podía entrar?», y esa respuesta el papel no la tiene.",
      },
      { tipo: "subtitulo", texto: "Fallo 5: acumula datos personales sin ningún control" },
      {
        tipo: "parrafo",
        texto:
          "Un cuaderno con nombres, documentos y placas es una base de datos personales, aunque esté escrita a mano. Queda sobre un mostrador, a la vista del siguiente que llega, cualquiera puede fotografiarlo y nadie sabe cuándo se destruye. Es el mismo riesgo que un archivo digital sin permisos, pero sin la posibilidad de auditarlo.",
      },
      {
        tipo: "nota",
        texto:
          "El detalle que más sorprende a las administraciones: el cuaderno abierto en el mostrador deja que cada visitante lea los datos de los anteriores. Eso, en un sistema digital, sería una filtración; en papel se normaliza porque siempre fue así.",
      },
      { tipo: "subtitulo", texto: "Qué se pierde en concreto" },
      {
        tipo: "lista",
        items: [
          "Trazabilidad: no se puede reconstruir un día con precisión razonable.",
          "Responsabilidad: no queda claro quién autorizó cada ingreso.",
          "Continuidad: lo que sabe un turno no llega al siguiente.",
          "Privacidad: datos de terceros expuestos y conservados sin criterio.",
          "Tiempo del vigilante: escribir a mano en hora punta alarga la cola en la puerta.",
        ],
      },
      { tipo: "subtitulo", texto: "El cuaderno no es el problema; el proceso sí" },
      {
        tipo: "parrafo",
        texto:
          "Conviene decirlo con claridad: cambiar el cuaderno por una pantalla, sin cambiar nada más, sirve de poco. Si nadie definió quién autoriza ni qué se conserva, el resultado será el mismo desorden con mejor tipografía. Lo que resuelve de verdad es que la autorización ocurra antes de que la visita llegue, y que quede registrada sola.",
      },
      {
        tipo: "parrafo",
        texto:
          "Ese es el cambio de fondo: pasar de registrar lo que ya pasó a autorizar lo que va a pasar. El registro, entonces, es un subproducto y no una tarea extra en el peor momento.",
      },
    ],
  },

  {
    slug: "protocolo-para-el-vigilante",
    titulo: "Protocolo de puerta: cómo evitar discusiones sin ser inflexible",
    resumen:
      "Los conflictos en la garita casi nunca son por seguridad, sino por reglas que cambian según el turno. Un protocolo corto y los cuatro casos difíciles resueltos de antemano.",
    categoria: "Operación diaria",
    minutos: 7,
    actualizado: "2026-08-16",
    bloques: [
      {
        tipo: "parrafo",
        texto:
          "Si le preguntas a un vigilante qué parte de su trabajo lo desgasta, rara vez menciona un robo. Menciona al residente que discute porque ayer sí lo dejaron pasar. La causa de fondo casi siempre es la misma: la regla existe, pero no está escrita, así que cada turno la aplica un poco distinto y el residente concluye, con razón, que es arbitraria.",
      },
      { tipo: "subtitulo", texto: "Un protocolo que cabe en una hoja" },
      {
        tipo: "parrafo",
        texto:
          "Un protocolo largo no se lee. El que funciona cabe en una hoja pegada en la garita y responde cuatro preguntas: a quién se deja pasar directo, a quién se le consulta, a quién no se le deja pasar y qué se hace cuando el residente no contesta.",
      },
      {
        tipo: "numerada",
        items: [
          "Visita anunciada por el residente: pasa. Se verifica el nombre y se registra la hora. No se llama para confirmar lo que ya está autorizado.",
          "Visita no anunciada: se consulta al residente por el canal acordado. Si autoriza, pasa; si no contesta, la visita espera fuera.",
          "Proveedor o servicio contratado por el condominio: pasa con autorización de la administración, no del vigilante.",
          "Persona sin destino claro o que se niega a identificarse: no pasa, y se avisa a la administración. Este es el único caso donde el vigilante decide solo.",
        ],
      },
      { tipo: "subtitulo", texto: "Los cuatro casos que generan casi todos los pleitos" },
      {
        tipo: "parrafo",
        texto:
          "Vale la pena resolverlos por escrito antes de que ocurran, porque discutirlos en caliente y frente a un tercero siempre sale mal.",
      },
      {
        tipo: "lista",
        items: [
          "El residente no contesta el teléfono. Regla clara: la visita espera en el área designada, no en la vía pública ni adentro. Sin excepciones por lluvia o por insistencia, o la excepción se convierte en la norma.",
          "Un familiar dice ser de la unidad pero no está registrado. Solo el titular actualiza la lista de residentes; el vigilante no inscribe a nadie en la puerta.",
          "La visita llega antes que el aviso. Se trata como no anunciada. Si el residente reclama, el reclamo va a la administración, no al vigilante.",
          "Delivery y taxis. Merecen su propia regla, porque el volumen es alto y el tiempo de espera corto; decidir cada caso individualmente colapsa la garita.",
        ],
      },
      {
        tipo: "nota",
        texto:
          "Regla general que ahorra muchos malos ratos: el vigilante nunca discute la regla, solo la aplica, e indica dónde reclamar. Cuando el vigilante defiende la norma como si fuera suya, el conflicto se vuelve personal y escala.",
      },
      { tipo: "subtitulo", texto: "El trato también es parte del protocolo" },
      {
        tipo: "parrafo",
        texto:
          "Una visita rechazada correctamente y una visita rechazada con desprecio producen el mismo resultado operativo y consecuencias muy distintas para el condominio. Conviene entrenar tres frases: cómo se pide un documento, cómo se explica una espera y cómo se niega un ingreso. Suena menor; es lo que más se recuerda.",
      },
      { tipo: "subtitulo", texto: "Cómo saber si el protocolo está funcionando" },
      {
        tipo: "lista",
        items: [
          "Los reclamos por ingreso bajan y, sobre todo, dejan de repetirse por el mismo motivo.",
          "El vigilante nuevo puede cubrir un turno sin que nadie le explique las excepciones de memoria.",
          "La administración deja de recibir consultas del tipo «¿lo dejo pasar o no?».",
          "Cuando hay un incidente, se puede reconstruir qué pasó sin depender del recuerdo de nadie.",
        ],
      },
      {
        tipo: "parrafo",
        texto:
          "Ese último punto es el que más se subestima. Un protocolo escrito no solo evita discusiones: convierte el turno de un vigilante en información utilizable, que es justo lo que falta cuando algo sale mal.",
      },
    ],
  },

  {
    slug: "delivery-proveedores-y-taxis",
    titulo: "Delivery, taxis y proveedores: reglas que no colapsan la puerta",
    resumen:
      "El reparto a domicilio es hoy el mayor volumen de ingresos en un condominio urbano. Tres modelos de manejo, con sus ventajas y sus costos reales.",
    categoria: "Operación diaria",
    minutos: 6,
    actualizado: "2026-08-16",
    bloques: [
      {
        tipo: "parrafo",
        texto:
          "En muchos condominios de Lima, el reparto a domicilio ya supera en volumen a las visitas propiamente dichas. Aplicarle el mismo procedimiento que a un invitado a cenar —llamar al residente, esperar confirmación, registrar datos completos— hace que la puerta colapse en el horario de almuerzo y cena.",
      },
      { tipo: "subtitulo", texto: "Los tres modelos que se usan en la práctica" },
      {
        tipo: "tabla",
        encabezados: ["Modelo", "Cómo funciona", "Cuándo conviene"],
        filas: [
          [
            "Entrega en garita",
            "El repartidor no ingresa; deja el pedido y el residente lo recoge",
            "Edificios verticales con recepción cercana a los ascensores",
          ],
          [
            "Ingreso acompañado",
            "El repartidor entra con registro y llega a la puerta del departamento",
            "Condominios horizontales donde caminar hasta la garita es largo",
          ],
          [
            "Ingreso libre con registro",
            "Se registra el ingreso y el repartidor circula sin acompañamiento",
            "Solo con cámaras y accesos internos controlados",
          ],
        ],
      },
      {
        tipo: "parrafo",
        texto:
          "La entrega en garita es la más segura y la que más fricción genera con los residentes, sobre todo con comida caliente y con quien vive en un piso alto. Conviene decidirlo en junta y no dejarlo al criterio del turno, porque es una decisión que afecta a todos todos los días.",
      },
      { tipo: "subtitulo", texto: "Qué registrar de un repartidor" },
      {
        tipo: "parrafo",
        texto:
          "Menos de lo que se suele pedir. Un repartidor pasa cinco minutos en el condominio y viene de una plataforma que ya lo identifica. Registrar su documento completo alarga la cola y acumula datos personales que no vas a usar nunca.",
      },
      {
        tipo: "lista",
        items: [
          "Unidad de destino: imprescindible, es lo que permite avisar y trazar.",
          "Hora de ingreso y de salida: barato de capturar y útil si algo pasa.",
          "Empresa o aplicación: suficiente para identificar el origen.",
          "Placa, solo si ingresa en vehículo al estacionamiento.",
        ],
      },
      {
        tipo: "nota",
        texto:
          "Un detalle práctico que evita conflictos: si el condominio decide entrega en garita, hay que asegurar dónde se dejan los pedidos y quién responde si se pierde uno. Sin eso, la regla dura hasta el primer pedido extraviado.",
      },
      { tipo: "subtitulo", texto: "Proveedores y personal de servicio: caso distinto" },
      {
        tipo: "parrafo",
        texto:
          "Un gasfitero contratado por un residente, una trabajadora del hogar o el técnico del ascensor no son visitas ocasionales: entran con regularidad, permanecen horas y a veces acceden a zonas comunes o a áreas técnicas. Ahí sí justifica un registro más completo y, sobre todo, saber si siguen adentro.",
      },
      {
        tipo: "parrafo",
        texto:
          "La pregunta que un condominio debería poder responder en cualquier momento es simple: ¿quién está adentro que no vive aquí? Si no se puede contestar, el control de accesos está incompleto por más cuaderno o sistema que haya en la puerta.",
      },
      {
        tipo: "parrafo",
        texto:
          "Para el personal recurrente conviene una lista autorizada por unidad, que el residente mantiene y la administración valida. Así el ingreso deja de ser una consulta diaria y pasa a ser una verificación de segundos, que es donde se gana tiempo de verdad.",
      },
    ],
  },
]
