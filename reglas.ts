/**
 * Catálogo de reglas del Sistema Experto de Orientación
 */

export interface ReglaInfo {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'acceso' | 'ponderacion' | 'aviso' | 'consejo' | 'pasarela' | 'perfil';
}

export const REGLAS_CATALOGO: Record<string, ReglaInfo> = {
  'R-ACC-01': {
    id: 'R-ACC-01',
    nombre: 'Acceso directo a Formación Profesional de Grado Superior',
    descripcion: 'Cualquier Ciclo Formativo de Grado Superior de esta familia profesional es directamente accesible con el título de Bachillerato desde cualquier modalidad, sin pruebas adicionales.',
    tipo: 'acceso',
  },
  'R-ACC-02': {
    id: 'R-ACC-02',
    nombre: 'Acceso a Grados Universitarios',
    descripcion: 'Esta rama universitaria es accesible tras obtener el título de Bachillerato y superar la prueba de acceso universitario (EBAU/PAU).',
    tipo: 'acceso',
  },
  'R-POND-01': {
    id: 'R-POND-01',
    nombre: 'Ausencia de materias con ponderación 0,2',
    descripcion: 'Ninguna de tus materias matriculadas de 2.º pondera con coeficiente máximo (0,2) para esta rama en el sistema universitario vasco, lo que dificulta maximizar la nota de admisión en la fase específica.',
    tipo: 'ponderacion',
  },
  'R-PRIO-01': {
    id: 'R-PRIO-01',
    nombre: 'Modalidad de Bachillerato no prioritaria',
    descripcion: 'Tu modalidad cursada no es Ciencias y Tecnología. Aunque no hay veto legal, el alumnado de Ciencias y Tecnología tiene prioridad y una base preparatoria más adecuada para Ingenierías y Arquitectura.',
    tipo: 'aviso',
  },
  'R-PRIV-01': {
    id: 'R-PRIV-01',
    nombre: 'Oferta en universidades privadas de Euskadi',
    descripcion: 'Esta rama cuenta con titulaciones en universidades de iniciativa privada en Euskadi (Universidad de Deusto y/o Mondragon Unibertsitatea), con criterios de admisión propios.',
    tipo: 'aviso',
  },
  'R-CURSO-01': {
    id: 'R-CURSO-01',
    nombre: 'Orientación para 1.º de Bachillerato',
    descripcion: 'Al estar cursando 1.º, tienes la oportunidad de elegir en 2.º materias que ponderen 0,2 para esta rama universitaria y optimizar tu nota de corte.',
    tipo: 'consejo',
  },
  'R-CURSO-02': {
    id: 'R-CURSO-02',
    nombre: 'Estrategia para 2.º de Bachillerato',
    descripcion: 'Al estar en 2.º, enfócate en asegurar la máxima calificación global y valora la pasarela desde un Grado Superior afín si la nota de corte resulta exigente.',
    tipo: 'consejo',
  },
  'R-PAS-01': {
    id: 'R-PAS-01',
    nombre: 'Pasarela FP Grado Superior a Universidad',
    descripcion: 'Existe vinculación directa entre este Grado Superior y la rama universitaria: puedes titular como Técnico Superior y acceder a la Universidad sin necesidad de realizar la fase obligatoria de la PAU.',
    tipo: 'pasarela',
  },
  'R-RECH-01': {
    id: 'R-RECH-01',
    nombre: 'Penalización por rechazo vocacional explícito',
    descripcion: 'Se reduce 1 punto de afinidad al detectarse discrepancia directa con actividades que te disgustan (gusto ≤ 2) en áreas que consideras relevantes evitar (importancia ≥ 4).',
    tipo: 'perfil',
  },
  'R-PLANO-01': {
    id: 'R-PLANO-01',
    nombre: 'Perfil de intereses vocacionales equilibrado / plano',
    descripcion: 'Tus intereses vocacionales están muy repartidos (diferencia menor a 0,5 entre tu 1.ª y 3.ª dimensión vocacional). Se recomiendan opciones formativas transversales y versátiles.',
    tipo: 'perfil',
  },
};

export const NOMBRES_FAMILIAS: Record<string, string> = {
  actividades_fisicas_deportivas: 'Actividades Físicas y Deportivas',
  administracion_gestion: 'Administración y Gestión',
  agraria: 'Agraria',
  artes_graficas: 'Artes Gráficas',
  comercio_marketing: 'Comercio y Marketing',
  edificacion_obra_civil: 'Edificación y Obra Civil',
  electricidad_electronica: 'Electricidad y Electrónica',
  energia_agua: 'Energía y Agua',
  fabricacion_mecanica: 'Fabricación Mecánica',
  hosteleria_turismo: 'Hostelería y Turismo',
  imagen_personal: 'Imagen Personal',
  imagen_sonido: 'Imagen y Sonido',
  industrias_alimentarias: 'Industrias Alimentarias',
  informatica_comunicaciones: 'Informática y Comunicaciones',
  instalacion_mantenimiento: 'Instalación y Mantenimiento',
  madera_mueble_corcho: 'Madera, Mueble y Corcho',
  maritimo_pesquera: 'Marítimo-Pesquera',
  quimica: 'Química',
  sanidad: 'Sanidad',
  seguridad_medio_ambiente: 'Seguridad y Medio Ambiente',
  servicios_socioculturales: 'Servicios Socioculturales y a la Comunidad',
  textil_confeccion_piel: 'Textil, Confección y Piel',
  transporte_mantenimiento_vehiculos: 'Transporte y Mantenimiento de Vehículos',
};

export const NOMBRES_RAMAS: Record<string, string> = {
  artes_humanidades: 'Artes y Humanidades',
  ciencias: 'Ciencias',
  ciencias_salud: 'Ciencias de la Salud',
  ciencias_sociales_juridicas: 'Ciencias Sociales y Jurídicas',
  ingenieria_arquitectura: 'Ingeniería y Arquitectura',
};

export const NOMBRES_UNIVERSIDADES: Record<string, { nombre: string; publica: boolean }> = {
  upv_ehu: { nombre: 'UPV/EHU (Universidad del País Vasco)', publica: true },
  deusto: { nombre: 'Universidad de Deusto', publica: false },
  mondragon: { nombre: 'Mondragon Unibertsitatea', publica: false },
};

export const NOMBRES_LETRAS_RIASEC: Record<string, { nombre: string; caracteristicas: string }> = {
  r: { nombre: 'Realista (R)', caracteristicas: 'Trabajo práctico, herramientas, maquinaria, aire libre, objetos tangibles.' },
  i: { nombre: 'Investigador (I)', caracteristicas: 'Curiosidad científica, lógica, análisis de datos, experimentos e ideas complejas.' },
  a: { nombre: 'Artístico (A)', caracteristicas: 'Creatividad, diseño, comunicación visual, expresión libre e innovación.' },
  s: { nombre: 'Social (S)', caracteristicas: 'Ayuda a personas, enseñanza, empatía, cuidados y orientación a la comunidad.' },
  e: { nombre: 'Emprendedor (E)', caracteristicas: 'Liderazgo, iniciativa, persuasión, proyectos propios y gestión comercial.' },
  c: { nombre: 'Convencional (C)', caracteristicas: 'Organización, metodologías claras, control administrativo, precisión y finanzas.' },
};
