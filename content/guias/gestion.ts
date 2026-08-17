import type { Guia } from "./tipos"

export const guiasGestion: Guia[] = [
  {
    slug: "datos-personales-de-visitas-en-peru",
    titulo: "Qué datos puedes pedirle a una visita en Perú",
    resumen:
      "Un cuaderno de garita con nombres y documentos es una base de datos personales. Qué exige la Ley 29733 en la práctica y cómo aplicarla sin complicar la puerta.",
    categoria: "Normativa",
    minutos: 8,
    actualizado: "2026-08-16",
    bloques: [
      {
        tipo: "parrafo",
        texto:
          "Muchas administraciones descubren tarde que el registro de visitas les impone obligaciones. En el Perú, la Ley N.º 29733, Ley de Protección de Datos Personales, se aplica a cualquier tratamiento de datos de personas identificadas o identificables, sin importar el soporte. Un cuaderno escrito a mano cuenta igual que una base de datos.",
      },
      {
        tipo: "nota",
        texto:
          "Esta guía explica los principios generales para orientar una decisión operativa. No sustituye a un abogado, y conviene revisar además el reglamento interno del condominio, que puede ser más exigente que la ley.",
      },
      { tipo: "subtitulo", texto: "Los principios que importan en la puerta" },
      {
        tipo: "parrafo",
        texto:
          "La ley se apoya en principios; tres de ellos deciden casi todo lo que pasa en una garita.",
      },
      {
        tipo: "lista",
        items: [
          "Finalidad: los datos se recogen para un propósito determinado y explícito. «Por seguridad» es demasiado vago; «para saber quién ingresó y quién lo autorizó» es un propósito concreto.",
          "Proporcionalidad: se pide lo necesario para esa finalidad, no todo lo que se pueda. Es el principio que más se incumple en las garitas.",
          "Seguridad: quien recoge los datos debe protegerlos. Un cuaderno abierto sobre el mostrador falla aquí de forma evidente.",
        ],
      },
      { tipo: "subtitulo", texto: "Aplicado a los datos concretos" },
      {
        tipo: "tabla",
        encabezados: ["Práctica habitual", "Problema", "Alternativa razonable"],
        filas: [
          [
            "Fotocopiar o fotografiar el DNI",
            "Conserva más datos de los necesarios y crea un archivo que hay que custodiar",
            "Verificar el documento a la vista y registrar solo nombre y número",
          ],
          [
            "Retener el DNI mientras dura la visita",
            "Privar a alguien de su documento es una práctica cuestionable",
            "Devolverlo tras verificar; usar credencial de visita si se necesita distintivo",
          ],
          [
            "Cuaderno abierto en el mostrador",
            "Cada visitante ve los datos de los anteriores",
            "Registro que solo vea el vigilante",
          ],
          [
            "Guardar los registros indefinidamente",
            "Sin plazo definido, la responsabilidad se acumula sin límite",
            "Definir un plazo de conservación y cumplirlo",
          ],
        ],
      },
      { tipo: "subtitulo", texto: "El aviso de privacidad: más simple de lo que parece" },
      {
        tipo: "parrafo",
        texto:
          "Quien entrega sus datos tiene derecho a saber quién los trata, para qué y por cuánto tiempo. En un condominio esto se resuelve con un cartel visible en la garita, redactado en lenguaje llano. No hace falta un documento extenso: hace falta que esté a la vista antes de que la persona entregue el dato.",
      },
      {
        tipo: "parrafo",
        texto:
          "Un texto de cuatro líneas que diga quién es el responsable del registro, con qué finalidad se recoge, cuánto tiempo se conserva y a dónde dirigirse para ejercer derechos cumple mejor su función que un reglamento de dos páginas que nadie leerá.",
      },
      { tipo: "subtitulo", texto: "Videovigilancia: el mismo criterio" },
      {
        tipo: "parrafo",
        texto:
          "Las cámaras también tratan datos personales. Los criterios son equivalentes: informar con carteles visibles de que la zona está videovigilada, no enfocar espacios privados como ventanas de departamentos o la vía pública más allá de lo necesario, restringir quién puede ver las grabaciones y definir cuánto tiempo se conservan.",
      },
      {
        tipo: "parrafo",
        texto:
          "En la práctica, el punto más descuidado es el tercero: monitores a la vista de cualquiera que pase por la garita, y acceso a las grabaciones sin registro de quién las consultó ni por qué.",
      },
      { tipo: "subtitulo", texto: "Una lista corta para revisar tu condominio" },
      {
        tipo: "numerada",
        items: [
          "¿Está escrito para qué se recogen los datos de visitas?",
          "¿Se pide algún dato que no se usa nunca? Si es así, dejar de pedirlo es la mejora más barata que existe.",
          "¿Puede un visitante ver los datos de otro?",
          "¿Hay un plazo de conservación definido y alguien que lo aplique?",
          "¿Hay un aviso visible en la puerta sobre el registro y las cámaras?",
          "¿Quién tiene acceso al registro y a las grabaciones, y queda constancia de esos accesos?",
        ],
      },
      {
        tipo: "parrafo",
        texto:
          "Si la mayoría de respuestas es «no lo sé», no es un caso raro: es la situación normal en la mayoría de los condominios. Pero también es el motivo por el que un incidente relativamente menor puede convertirse en un problema para la junta.",
      },
    ],
  },

  {
    slug: "aprobar-un-sistema-en-la-junta-de-propietarios",
    titulo: "Cómo llevar un sistema de control de accesos a la junta de propietarios",
    resumen:
      "La propuesta técnica suele estar bien; la que fracasa es la presentación. Cómo plantear el problema, el costo y las objeciones previsibles ante la junta.",
    categoria: "Gestión del condominio",
    minutos: 7,
    actualizado: "2026-08-16",
    bloques: [
      {
        tipo: "parrafo",
        texto:
          "En los condominios sujetos al régimen de propiedad exclusiva y propiedad común, las decisiones que afectan a los bienes y servicios comunes pasan por la junta de propietarios. Un sistema de control de accesos entra en esa categoría, y ahí es donde muchas iniciativas razonables mueren.",
      },
      {
        tipo: "parrafo",
        texto:
          "No mueren por el costo. Mueren porque se presentan como una compra de tecnología en vez de como la solución a un problema que los propietarios ya sienten.",
      },
      { tipo: "subtitulo", texto: "Empieza por el problema, con datos propios" },
      {
        tipo: "parrafo",
        texto:
          "Antes de hablar de sistemas, junta evidencia de tu propio condominio. Dos semanas bastan y no requieren nada especial.",
      },
      {
        tipo: "lista",
        items: [
          "Cuántos ingresos de terceros hay por día y en qué franjas se concentran.",
          "Cuántos reclamos por temas de puerta llegaron en el último trimestre.",
          "Cuánto tarda hoy responder «¿quién entró el sábado por la noche?».",
          "Cuántos incidentes hubo donde no se pudo determinar quién autorizó el ingreso.",
        ],
      },
      {
        tipo: "parrafo",
        texto:
          "Ese último número suele ser el que cambia la conversación. Un propietario puede discutir si hace falta un sistema; le cuesta más discutir que en tres casos del año pasado nadie supo quién dejó entrar a alguien.",
      },
      { tipo: "subtitulo", texto: "Presenta el costo en la unidad en que se decide" },
      {
        tipo: "parrafo",
        texto:
          "Un costo mensual total suena a gasto nuevo. El mismo costo dividido entre las unidades suele caber dentro de lo que ya se paga de mantenimiento, y se compara solo con el resto de servicios comunes.",
      },
      {
        tipo: "parrafo",
        texto:
          "Conviene también decir en voz alta lo que el sistema no ahorra. Si no reduce el número de vigilantes —y normalmente no lo hace—, decirlo antes evita que alguien lo plantee como objeción y te deje a la defensiva.",
      },
      { tipo: "subtitulo", texto: "Las objeciones que van a aparecer" },
      {
        tipo: "tabla",
        encabezados: ["Objeción", "Respuesta que funciona"],
        filas: [
          [
            "«El cuaderno siempre nos ha servido»",
            "Proponer una prueba concreta: buscar en el cuaderno quién entró un día determinado, delante de todos, y cronometrarlo",
          ],
          [
            "«Los vigilantes no lo van a usar»",
            "Es un riesgo real. Se mitiga con un piloto de un mes y con capacitación pagada dentro del horario, no sobre la marcha",
          ],
          [
            "«Es un gasto que no urge»",
            "Contrastarlo con el costo de un solo incidente mal documentado, y con lo que ya se gasta en servicios comunes",
          ],
          [
            "«¿Y nuestros datos?»",
            "Traer respondido quién accede al registro, cuánto se conserva y qué pasa si el proveedor desaparece",
          ],
        ],
      },
      { tipo: "subtitulo", texto: "Pide una decisión concreta, no un respaldo general" },
      {
        tipo: "parrafo",
        texto:
          "«¿Están de acuerdo en mejorar la seguridad?» produce asentimiento y ninguna decisión. Lo que se vota debería ser algo ejecutable: aprobar un piloto de un mes en una puerta, con un costo tope, y una fecha para evaluar resultados con los indicadores que se acordaron al inicio.",
      },
      {
        tipo: "parrafo",
        texto:
          "Un piloto acotado, además, desactiva casi todas las objeciones: nadie se juega el presupuesto anual en algo reversible, y la discusión pasa de opiniones a resultados observables.",
      },
    ],
  },

  {
    slug: "indicadores-de-control-de-accesos",
    titulo: "Seis indicadores para saber si tu control de accesos funciona",
    resumen:
      "«Se siente más seguro» no es un indicador. Seis medidas concretas que un condominio puede seguir sin herramientas especiales, y qué significa cada una.",
    categoria: "Gestión del condominio",
    minutos: 6,
    actualizado: "2026-08-16",
    bloques: [
      {
        tipo: "parrafo",
        texto:
          "El control de accesos es de esas cosas que se evalúan por sensación. El problema de la sensación es que cambia con el último incidente: un robo en la zona y todo parece insuficiente; tres meses tranquilos y parece que sobra. Conviene tener medidas que no dependan del ánimo.",
      },
      { tipo: "subtitulo", texto: "1. Tiempo de respuesta a la pregunta clave" },
      {
        tipo: "parrafo",
        texto:
          "Cuánto tardas en responder «¿quién ingresó el sábado entre las 20:00 y las 23:00 y quién lo autorizó?». Es el indicador más honesto que existe, porque no se puede fingir. Si la respuesta pasa de unos minutos, el registro no está cumpliendo su función.",
      },
      { tipo: "subtitulo", texto: "2. Ingresos sin autorización identificable" },
      {
        tipo: "parrafo",
        texto:
          "De todos los ingresos de terceros del mes, en cuántos se puede decir con certeza quién autorizó. La meta no es cero incidentes, es cero huecos. Un ingreso legítimo que nadie recuerda haber autorizado es exactamente el que causa problemas después.",
      },
      { tipo: "subtitulo", texto: "3. Personas dentro al cierre del turno" },
      {
        tipo: "parrafo",
        texto:
          "Cuántos terceros figuran como ingresados y no como salidos al terminar el día. Un número alto casi nunca significa que haya gente adentro: significa que las salidas no se registran, y entonces el registro solo cuenta la mitad de la historia.",
      },
      { tipo: "subtitulo", texto: "4. Reclamos relacionados con la puerta" },
      {
        tipo: "parrafo",
        texto:
          "Cuántos y, sobre todo, cuántos se repiten por el mismo motivo. Un reclamo nuevo es información útil; el mismo reclamo tres veces indica una regla que no está clara o que no se aplica igual en todos los turnos.",
      },
      { tipo: "subtitulo", texto: "5. Tiempo de espera en hora punta" },
      {
        tipo: "parrafo",
        texto:
          "Cuánto espera una visita entre que llega y que pasa, en el peor horario del día. Es el contrapeso necesario: un control perfecto que genera cinco minutos de cola en cada ingreso terminará relajándose solo, porque la presión de la fila siempre gana.",
      },
      { tipo: "subtitulo", texto: "6. Cobertura del personal recurrente" },
      {
        tipo: "parrafo",
        texto:
          "Qué porcentaje del personal que entra con regularidad —trabajadoras del hogar, gasfiteros, técnicos— está en una lista autorizada y actualizada. Es donde más se acumula el riesgo, porque son los que más entran y los que menos se verifican.",
      },
      {
        tipo: "nota",
        texto:
          "Con dos indicadores basta para empezar. El primero y el segundo son los que más rápido revelan si el sistema, sea cuaderno o software, está sosteniendo el proceso o solo aparentándolo.",
      },
      { tipo: "subtitulo", texto: "Cómo usarlos sin burocratizar el condominio" },
      {
        tipo: "parrafo",
        texto:
          "Medir una vez al mes es suficiente, y no requiere herramientas especiales: una muestra de una semana da una idea razonable. Lo importante es fijar el valor de partida antes de cambiar nada. Sin línea base, cualquier mejora será discutible y cualquier fracaso, atribuible a otra cosa.",
      },
    ],
  },

  {
    slug: "elegir-software-de-control-de-visitas",
    titulo: "Qué mirar al elegir un software de control de visitas",
    resumen:
      "Las funciones que se lucen en una demo rara vez son las que deciden si el sistema sobrevive al tercer mes. Ocho criterios prácticos, incluido cómo salir del proveedor.",
    categoria: "Tecnología",
    minutos: 7,
    actualizado: "2026-08-16",
    bloques: [
      {
        tipo: "parrafo",
        texto:
          "Las demostraciones de software se parecen mucho entre sí, y todas funcionan. Lo que decide el resultado no aparece en la demo: aparece el tercer mes, cuando el vigilante nuevo tiene que usarlo sin nadie al lado y el internet de la garita se cae.",
      },
      { tipo: "subtitulo", texto: "Criterios que se notan desde el primer día" },
      {
        tipo: "numerada",
        items: [
          "Cuántos toques hace falta para registrar un ingreso corriente. Si son más de tres o cuatro, en hora punta se saltará el proceso.",
          "Si el residente puede autorizar antes de que la visita llegue. Es la diferencia entre registrar el pasado y controlar el presente.",
          "Si funciona en el teléfono que ya tiene el vigilante, o exige comprar equipos.",
          "Qué pasa cuando se cae internet. Un sistema que se bloquea deja la puerta sin procedimiento justo cuando más se nota.",
        ],
      },
      { tipo: "subtitulo", texto: "Criterios que se notan cuando algo sale mal" },
      {
        tipo: "numerada",
        items: [
          "Búsqueda real: poder filtrar por fecha, unidad, persona o placa en segundos. Un sistema que solo muestra una lista cronológica repite el defecto del cuaderno.",
          "Registro de auditoría: quién consultó qué y cuándo. Sin esto, no se puede investigar un mal uso interno.",
          "Permisos por rol: el vigilante no debería ver el histórico completo de todas las unidades.",
          "Exportación de tus datos en un formato abierto. Es la garantía de que puedes irte.",
        ],
      },
      {
        tipo: "nota",
        texto:
          "La pregunta que más incomoda a un proveedor, y la que más conviene hacer: «si mañana decidimos cambiar de sistema, ¿cómo nos llevamos el histórico?». La respuesta dice mucho sobre la relación que estás por firmar.",
      },
      { tipo: "subtitulo", texto: "Lo que no debería pesar tanto como pesa" },
      {
        tipo: "lista",
        items: [
          "Reconocimiento facial y lectura automática de placas: suenan muy bien, dependen de condiciones de luz y de cámaras adecuadas, y encarecen todo. Rara vez son el cuello de botella real.",
          "Cantidad de reportes disponibles: veinte reportes que nadie abre valen menos que uno que se revisa cada mes.",
          "Aplicación propia para residentes: útil, pero si obliga a instalar algo a cada visitante, la adopción se cae sola.",
        ],
      },
      { tipo: "subtitulo", texto: "Cómo probarlo antes de decidir" },
      {
        tipo: "parrafo",
        texto:
          "Un piloto de un mes en una sola puerta, con el equipo real y sin acompañamiento del proveedor durante la última semana. Ese último detalle es el que revela la verdad: un sistema que funciona solo mientras alguien está ayudando no está listo para tu condominio.",
      },
      {
        tipo: "parrafo",
        texto:
          "Y antes de firmar, define con qué números vas a evaluar el piloto. Si no se acuerdan al inicio, la evaluación terminará siendo una discusión de impresiones, que es justo lo que se quería evitar.",
      },
    ],
  },
]
