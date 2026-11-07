/** Reviewed English/Spanish equivalents; no invented locale-wide alternates. */
export const LANGUAGE_PAIRS = [
  { en: "/", es: "/es" },
  { en: "/car-detailing-baton-rouge", es: "/es/detallado-de-autos-baton-rouge" },
];
export function languageAlternates(path: string) {
  const pair = LANGUAGE_PAIRS.find(p => p.en === path || p.es === path);
  return pair ? [{ lang: "en", path: pair.en }, { lang: "es", path: pair.es }, { lang: "x-default", path: pair.en }] : [];
}
export const SPANISH_PAGES = [
  {
    path: "/es", title: "AV Detailing | Detallado móvil en Baton Rouge",
    description: "Detallado móvil de autos, barcos, RV y aeronaves en Baton Rouge. Recubrimiento cerámico System X y corrección de pintura. Compare servicios y reserve.",
    h1: "AV Detailing en Baton Rouge", intro: "Detallado móvil de autos en Baton Rouge y sus alrededores. Vamos a su casa u oficina. También ofrecemos servicios para barcos, vehículos recreativos y aeronaves privadas, con alcance y acceso coordinados para cada trabajo.",
    sections: [{ heading: "Servicios para su vehículo", paragraphs: ["Compare los paquetes Basic, Silver y Gold para autos. Ofrecemos corrección de pintura y recubrimiento cerámico System X con opciones de 3, 6 y 10 años. El alcance de la corrección se evalúa y cotiza por separado."] }, { heading: "Servicios especializados", paragraphs: ["El detallado de RV es solo exterior e incluye opciones de limpieza del techo. La limpieza del casco de barcos requiere remolque o elevador; no ofrecemos limpieza dentro del agua. Las aeronaves privadas se atienden mediante cotización, sin depósito, y el acceso se coordina para cada trabajo."] }, { heading: "Horario y pagos", paragraphs: ["Lunes a domingo, de 6:00 a. m. a 8:00 p. m., hora de America/Chicago. La última hora de inicio para reservas públicas es a las 6:00 p. m. La ventana de llegada es de 30 minutos.", "Aceptamos solo tarjetas de crédito y débito, pagadas en línea al reservar o después desde su cuenta de cliente. No aceptamos efectivo, Venmo, Cash App ni Zelle. No se agregan comisiones adicionales al total mostrado durante la reserva."] }],
    links: [{ href: "/es/detallado-de-autos-baton-rouge", text: "Detallado de autos y paquetes" }, { href: "/ceramic-coating-baton-rouge", text: "Recubrimiento cerámico (en inglés)" }, { href: "/services", text: "Todos los servicios (en inglés)" }],
  },
  {
    path: "/es/detallado-de-autos-baton-rouge", title: "Detallado de autos en Baton Rouge | AV Detailing",
    description: "Compare paquetes Basic, Silver y Gold para detallado móvil de autos en Baton Rouge. Consulte precios iniciales e inclusiones y reserve en línea.",
    h1: "Detallado de autos en Baton Rouge", intro: "Compare nuestros paquetes Basic, Silver y Gold y elija el nivel de limpieza que necesita su vehículo. Vamos a su casa u oficina en Baton Rouge, Prairieville, Gonzales, Denham Springs, Walker, Central, Zachary y zonas cercanas.",
    sections: [{ heading: "Elija según las inclusiones", paragraphs: ["Basic incluye aspirado interior ligero y limpieza del tablero, consola y paneles de puertas; no incluye lavado de asientos ni limpieza profunda de alfombras.", "Silver incluye aspirado profundo de asientos, alfombras, tapetes y maletero, además de limpieza de consola, portavasos, paneles y tablero. El lavado de asientos no está incluido.", "Gold incluye lo de Silver, lavado de asientos y tapicería, limpieza y acondicionamiento del cuero y limpieza profunda de alfombras."] }, { heading: "Extras disponibles al reservar", paragraphs: ["Tratamiento con barra de arcilla, limpieza del compartimento del motor, restauración de faros, eliminación de olores y retirada de pelo de mascotas son extras seleccionables. No están incluidos automáticamente en Basic, Silver o Gold."] }, { heading: "Antes de su cita", paragraphs: ["Indique el vehículo, su estado y el trabajo que necesita. Las reservas públicas tienen horario de 6:00 a. m. a 8:00 p. m., con último inicio a las 6:00 p. m., hora de America/Chicago. La ventana de llegada es de 30 minutos. Confirme el acceso y cualquier preparación al reservar."] }],
    links: [{ href: "/interior-detailing-baton-rouge", text: "Detallado interior (en inglés)" }, { href: "/exterior-detailing-baton-rouge", text: "Detallado exterior (en inglés)" }, { href: "/ceramic-coating-cost-baton-rouge", text: "Precios de recubrimiento cerámico (en inglés)" }, { href: "/es", text: "Inicio en español" }],
  },
];