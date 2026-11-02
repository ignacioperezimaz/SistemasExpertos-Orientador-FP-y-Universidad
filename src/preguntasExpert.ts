/**
 * Gestión de preguntas adicionales y base de conocimiento experta
 * Permite a orientadores y profesorado ampliar el cuestionario vocacional
 */
import { ItemCuestionario, ITEMS_CUESTIONARIO, LetraRIASEC } from './perfil';

export const PIN_MODO_EXPERTO = '2026';
export const STORAGE_KEY_PREGUNTAS = 'orientador_preguntas_extra';
export const STORAGE_KEY_CAMBIOS = 'orientador_registro_cambios';

export interface PreguntaAñadida {
  id: number;
  letra: LetraRIASEC;
  texto: string;
  rasgoHolland: string;
  fuente: string;
  autor: string;
  fecha: string;
  activa: boolean;
  origen: 'añadida';
}

export interface ItemCuestionarioCompleto extends ItemCuestionario {
  rasgoHolland?: string;
  fuente?: string;
  autor?: string;
  fecha?: string;
  activa?: boolean;
  origen: 'base' | 'añadida';
}

export interface RegistroCambioConocimiento {
  id: string;
  fecha: string;
  autor: string;
  accion: 'alta' | 'modificacion' | 'activacion' | 'desactivacion' | 'eliminacion' | 'importacion';
  preguntaId: number;
  preguntaTexto: string;
  detalle?: string;
}

/** Metadatos pedagógicos de las 18 preguntas base de Holland SDS */
export const METADATOS_PREGUNTAS_BASE: Record<number, { rasgoHolland: string; fuente: string; autor: string }> = {
  1: { rasgoHolland: 'Destreza mecánica, manejo y reparación de maquinaria', fuente: 'Holland SDS (Vocational Preference Inventory)', autor: 'Sistema Base Oficial' },
  2: { rasgoHolland: 'Habilidad constructiva manual y espacial con materiales tangibles', fuente: 'Holland SDS (Vocational Preference Inventory)', autor: 'Sistema Base Oficial' },
  3: { rasgoHolland: 'Preferencia por actividad física y entornos naturales al aire libre', fuente: 'Holland SDS (Vocational Preference Inventory)', autor: 'Sistema Base Oficial' },
  4: { rasgoHolland: 'Curiosidad analítica y pensamiento científico para entender fenómenos', fuente: 'Holland SDS (Vocational Preference Inventory)', autor: 'Sistema Base Oficial' },
  5: { rasgoHolland: 'Razonamiento abstracto, lógica matemática y resolución de problemas', fuente: 'Holland SDS (Vocational Preference Inventory)', autor: 'Sistema Base Oficial' },
  6: { rasgoHolland: 'Metodología experimental, contraste de hipótesis y análisis de datos', fuente: 'Holland SDS (Vocational Preference Inventory)', autor: 'Sistema Base Oficial' },
  7: { rasgoHolland: 'Expresión estética visual, diseño gráfico y creación de contenido', fuente: 'Holland SDS (Vocational Preference Inventory)', autor: 'Sistema Base Oficial' },
  8: { rasgoHolland: 'Expresión artística narrativa, composición musical e interpretación', fuente: 'Holland SDS (Vocational Preference Inventory)', autor: 'Sistema Base Oficial' },
  9: { rasgoHolland: 'Pensamiento divergente, innovación y autonomía frente a pautas fijas', fuente: 'Holland SDS (Vocational Preference Inventory)', autor: 'Sistema Base Oficial' },
  10: { rasgoHolland: 'Vocación pedagógica, transmisión de conocimientos y docencia', fuente: 'Holland SDS (Vocational Preference Inventory)', autor: 'Sistema Base Oficial' },
  11: { rasgoHolland: 'Asistencia y cuidado empático a personas en situación de necesidad', fuente: 'Holland SDS (Vocational Preference Inventory)', autor: 'Sistema Base Oficial' },
  12: { rasgoHolland: 'Escucha activa, orientación personal y counselling psicológico', fuente: 'Holland SDS (Vocational Preference Inventory)', autor: 'Sistema Base Oficial' },
  13: { rasgoHolland: 'Liderazgo organizativo, coordinación de equipos y toma de decisiones', fuente: 'Holland SDS (Vocational Preference Inventory)', autor: 'Sistema Base Oficial' },
  14: { rasgoHolland: 'Capacidad de persuasión, comunicación comercial e influencia interpersonal', fuente: 'Holland SDS (Vocational Preference Inventory)', autor: 'Sistema Base Oficial' },
  15: { rasgoHolland: 'Iniciativa emprendedora, asunción de riesgos y creación de negocios', fuente: 'Holland SDS (Vocational Preference Inventory)', autor: 'Sistema Base Oficial' },
  16: { rasgoHolland: 'Estructuración sistemática, organización de ficheros y bases de datos', fuente: 'Holland SDS (Vocational Preference Inventory)', autor: 'Sistema Base Oficial' },
  17: { rasgoHolland: 'Rigor procedimental, control de calidad y verificación metódica', fuente: 'Holland SDS (Vocational Preference Inventory)', autor: 'Sistema Base Oficial' },
  18: { rasgoHolland: 'Gestión contable, finanzas, control presupuestario y administración', fuente: 'Holland SDS (Vocational Preference Inventory)', autor: 'Sistema Base Oficial' },
};

/** Normaliza un texto para comparación (sin acentos, minúsculas, sin signos de puntuación) */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Obtiene las preguntas añadidas desde localStorage de forma segura */
export function obtenerPreguntasAñadidas(): PreguntaAñadida[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREGUNTAS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (p) =>
          typeof p.id === 'number' &&
          typeof p.letra === 'string' &&
          typeof p.texto === 'string' &&
          p.origen === 'añadida'
      );
    }
    return [];
  } catch (err) {
    console.warn('No se pudieron leer las preguntas de localStorage:', err);
    return [];
  }
}

/** Guarda las preguntas añadidas en localStorage de forma segura */
export function guardarPreguntasAñadidas(preguntas: PreguntaAñadida[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY_PREGUNTAS, JSON.stringify(preguntas));
    return true;
  } catch (err) {
    console.error('Error al guardar preguntas en localStorage:', err);
    return false;
  }
}

/** Obtiene el registro de cambios desde localStorage */
export function obtenerRegistroCambios(): RegistroCambioConocimiento[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CAMBIOS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('No se pudo leer el registro de cambios:', err);
    return [];
  }
}

/** Registra una acción en el historial de cambios */
export function registrarCambio(
  cambio: Omit<RegistroCambioConocimiento, 'id' | 'fecha'> & { fecha?: string }
): void {
  try {
    const historial = obtenerRegistroCambios();
    const nuevoRegistro: RegistroCambioConocimiento = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      fecha: cambio.fecha || new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }),
      autor: cambio.autor,
      accion: cambio.accion,
      preguntaId: cambio.preguntaId,
      preguntaTexto: cambio.preguntaTexto,
      detalle: cambio.detalle,
    };
    historial.unshift(nuevoRegistro);
    localStorage.setItem(STORAGE_KEY_CAMBIOS, JSON.stringify(historial.slice(0, 100)));
  } catch (err) {
    console.warn('Error al registrar cambio en historial:', err);
  }
}

/** Devuelve la lista completa de preguntas (18 base + añadidas) con metadatos */
export function obtenerTodasLasPreguntas(preguntasAñadidas: PreguntaAñadida[]): ItemCuestionarioCompleto[] {
  const baseCompletas: ItemCuestionarioCompleto[] = ITEMS_CUESTIONARIO.map((it) => {
    const meta = METADATOS_PREGUNTAS_BASE[it.id] || {
      rasgoHolland: 'Definición de rasgo vocacional según tipología de Holland',
      fuente: 'Holland SDS',
      autor: 'Sistema Base Oficial',
    };
    return {
      ...it,
      rasgoHolland: meta.rasgoHolland,
      fuente: meta.fuente,
      autor: meta.autor,
      fecha: '2026-09-01',
      activa: true,
      origen: 'base' as const,
    };
  });

  const añadidasCompletas: ItemCuestionarioCompleto[] = preguntasAñadidas.map((p) => ({
    id: p.id,
    letra: p.letra,
    texto: p.texto,
    rasgoHolland: p.rasgoHolland,
    fuente: p.fuente,
    autor: p.autor,
    fecha: p.fecha,
    activa: p.activa,
    origen: 'añadida' as const,
  }));

  return [...baseCompletas, ...añadidasCompletas];
}

/**
 * Devuelve las preguntas activas para el cuestionario:
 * Las 18 base oficiales + las añadidas que estén marcadas como activas
 */
export function obtenerPreguntasActivasParaCuestionario(
  preguntasAñadidas: PreguntaAñadida[]
): ItemCuestionarioCompleto[] {
  const todas = obtenerTodasLasPreguntas(preguntasAñadidas);
  return todas.filter((p) => p.origen === 'base' || p.activa !== false);
}

/** Comprueba si una pregunta ya existe o es casi idéntica a alguna existente */
export function esPreguntaDuplicada(
  textoCandidato: string,
  idAExcluir?: number,
  preguntasAñadidas?: PreguntaAñadida[]
): { duplicada: boolean; textoOriginal?: string; idCoincidente?: number } {
  const extra = preguntasAñadidas || obtenerPreguntasAñadidas();
  const todas = obtenerTodasLasPreguntas(extra);
  const candidatoNorm = normalizarTexto(textoCandidato);

  for (const p of todas) {
    if (idAExcluir !== undefined && p.id === idAExcluir) continue;
    const pNorm = normalizarTexto(p.texto);
    if (candidatoNorm === pNorm) {
      return { duplicada: true, textoOriginal: p.texto, idCoincidente: p.id };
    }
  }

  return { duplicada: false };
}

/** Calcula estadísticas psicométricas y alertas de balance entre dimensiones */
export function calcularBalanceDimensiones(preguntasActivas: ItemCuestionarioCompleto[]): {
  conteoPorLetra: Record<LetraRIASEC, number>;
  alertaSobrecarga: Array<{ letra: LetraRIASEC; total: number }>;
  alertaDesbalance: boolean;
  minPreguntas: number;
  maxPreguntas: number;
} {
  const conteoPorLetra: Record<LetraRIASEC, number> = {
    r: 0,
    i: 0,
    a: 0,
    s: 0,
    e: 0,
    c: 0,
  };

  for (const p of preguntasActivas) {
    conteoPorLetra[p.letra] = (conteoPorLetra[p.letra] || 0) + 1;
  }

  const valores = Object.values(conteoPorLetra);
  const minPreguntas = Math.min(...valores);
  const maxPreguntas = Math.max(...valores);

  const alertaSobrecarga: Array<{ letra: LetraRIASEC; total: number }> = [];
  (Object.keys(conteoPorLetra) as LetraRIASEC[]).forEach((l) => {
    if (conteoPorLetra[l] > 5) {
      alertaSobrecarga.push({ letra: l, total: conteoPorLetra[l] });
    }
  });

  const alertaDesbalance = maxPreguntas - minPreguntas > 2;

  return {
    conteoPorLetra,
    alertaSobrecarga,
    alertaDesbalance,
    minPreguntas,
    maxPreguntas,
  };
}

/** Calcula el próximo ID disponible para una nueva pregunta */
export function siguienteIdPregunta(preguntasAñadidas: PreguntaAñadida[]): number {
  const maxBase = Math.max(...ITEMS_CUESTIONARIO.map((it) => it.id));
  const maxExtra = preguntasAñadidas.length > 0 ? Math.max(...preguntasAñadidas.map((p) => p.id)) : 0;
  return Math.max(maxBase, maxExtra) + 1;
}
