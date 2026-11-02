/**
 * Motor de Inferencia Prolog con Tau-Prolog en el navegador
 */
import pl from 'tau-prolog';
import listsModule from 'tau-prolog/modules/lists.js';
import kbRaw from './kb.pl?raw';
import { ResultadoPerfil } from './perfil';
import {
  REGLAS_CATALOGO,
  NOMBRES_FAMILIAS,
  NOMBRES_RAMAS,
  NOMBRES_UNIVERSIDADES,
  ReglaInfo,
} from './reglas';

// Inicializar el módulo de listas en Tau-Prolog
if (typeof listsModule === 'function') {
  listsModule(pl);
} else if (listsModule && typeof (listsModule as any).default === 'function') {
  (listsModule as any).default(pl);
}

export interface DatosUsuario {
  curso: 1 | 2;
  modalidad: 'ciencias_tecnologia' | 'humanidades_ccss' | 'artes' | 'general';
  materias: string[];
  contemplaPrivada: boolean;
  preferencia: 'fp' | 'uni' | 'sin_decidir';
  notaMedia?: number | null;
}

export interface PasarelaDetalle {
  tipo: 'fp_a_uni' | 'uni_desde_fp';
  familiaFpId: string;
  familiaFpNombre: string;
  ramaUniId: string;
  ramaUniNombre: string;
  reglaId: string;
  textoExplicativo: string;
}

export interface OpcionRecomendada {
  id: string;
  tipo: 'fp' | 'uni';
  nombre: string;
  afinidadBase: number;
  penalizaciones: string[];
  puntuacionFinal: number;
  reglaAcceso: string;
  universidades: Array<{ id: string; nombre: string; publica: boolean }>;
  avisos: string[];
  consejos: string[];
  pasarelas: PasarelaDetalle[];
}

export interface ReglaDisparadaConContexto extends ReglaInfo {
  origen: string;
}

export interface ResultadoMotor {
  topOpciones: OpcionRecomendada[];
  todasLasOpciones: OpcionRecomendada[];
  reglasDisparadas: ReglaDisparadaConContexto[];
  esPerfilPlano: boolean;
  perfil: ResultadoPerfil;
  datosUsuario: DatosUsuario;
}

/**
 * Convierte un término de Tau-Prolog a string legible
 */
function termToString(t: any): string {
  if (!t) return '';
  if (t.args && t.args.length > 0) {
    return t.id + '(' + t.args.map(termToString).join(', ') + ')';
  }
  if (t.value !== undefined) return String(t.value);
  return t.id || '';
}

/**
 * Ejecuta una consulta Prolog secuencialmente sobre la sesión activa y retorna todas las soluciones
 */
function ejecutarConsulta(session: any, queryStr: string): Promise<Array<Record<string, any>>> {
  return new Promise((resolve) => {
    const soluciones: Array<Record<string, any>> = [];
    session.query(queryStr, {
      success: () => {
        function obtenerSiguiente() {
          session.answer({
            success: (ans: any) => {
              const fila: Record<string, any> = {};
              if (ans && ans.links) {
                for (const [k, v] of Object.entries<any>(ans.links)) {
                  fila[k] = termToString(v);
                  if (v && v.value !== undefined) {
                    fila[k + '_num'] = v.value;
                  }
                }
              }
              soluciones.push(fila);
              obtenerSiguiente();
            },
            fail: () => resolve(soluciones),
            error: (err: any) => {
              console.error('Error de consulta Prolog:', queryStr, err);
              resolve(soluciones);
            },
          });
        }
        obtenerSiguiente();
      },
      error: (err: any) => {
        console.error('Error al analizar consulta Prolog:', queryStr, err);
        resolve([]);
      },
    });
  });
}

/**
 * Ejecuta el motor Prolog con la base de conocimiento y los datos del estudiante
 */
export async function ejecutarMotor(
  datos: DatosUsuario,
  perfil: ResultadoPerfil
): Promise<ResultadoMotor> {
  // Construir hechos del usuario para Prolog
  const lineasHechos: string[] = [
    `curso(${datos.curso}).`,
    `modalidad(${datos.modalidad}).`,
    `contempla_privada(${datos.contemplaPrivada ? 'si' : 'no'}).`,
  ];

  for (const m of datos.materias) {
    lineasHechos.push(`materia(${m}).`);
  }

  // Hechos de puntuación y rechazos RIASEC
  lineasHechos.push(perfil.hechosProlog);

  const programaCompleto = `:- use_module(library(lists)).\n${kbRaw}\n${lineasHechos.join('\n')}\n`;

  const session = pl.create(1500);

  await new Promise<void>((resolve, reject) => {
    session.consult(programaCompleto, {
      success: () => resolve(),
      error: (err: any) => {
        console.error('Error al consultar KB en Tau-Prolog:', err);
        reject(err);
      },
    });
  });

  // Ejecución secuencial de consultas Prolog
  const ansAccesible = await ejecutarConsulta(session, 'accesible(Op, Regla).');
  const ansAfinidad = await ejecutarConsulta(session, 'afinidad(Op, Media).');
  const ansPenalizada = await ejecutarConsulta(session, 'penalizada(Op, L).');
  const ansAviso = await ejecutarConsulta(session, 'aviso(Op, Regla).');
  const ansConsejo = await ejecutarConsulta(session, 'consejo(Op, Regla).');
  const ansPasarela = await ejecutarConsulta(session, 'pasarela(uni(R), fp(F), Regla).');
  const ansUni = await ejecutarConsulta(session, 'universidad_para(R, U).');

  // Procesar afinidades
  const afinidadesMap = new Map<string, number>();
  for (const a of ansAfinidad) {
    const op = a.Op;
    const media = typeof a.Media_num === 'number' ? a.Media_num : parseFloat(a.Media) || 0;
    afinidadesMap.set(op, Math.round(media * 100) / 100);
  }

  // Procesar penalizaciones por rechazo (regla R-RECH-01)
  const penalizacionesMap = new Map<string, Set<string>>();
  for (const p of ansPenalizada) {
    const op = p.Op;
    const l = p.L;
    if (!penalizacionesMap.has(op)) {
      penalizacionesMap.set(op, new Set());
    }
    penalizacionesMap.get(op)!.add(l);
  }

  // Procesar avisos
  const avisosMap = new Map<string, Set<string>>();
  for (const av of ansAviso) {
    const op = av.Op;
    const regla = av.Regla;
    if (!avisosMap.has(op)) {
      avisosMap.set(op, new Set());
    }
    avisosMap.get(op)!.add(regla);
  }

  // Procesar consejos
  const consejosMap = new Map<string, Set<string>>();
  for (const co of ansConsejo) {
    const op = co.Op;
    const regla = co.Regla;
    if (!consejosMap.has(op)) {
      consejosMap.set(op, new Set());
    }
    consejosMap.get(op)!.add(regla);
  }

  // Procesar universidades para ramas universitarias
  const uniMap = new Map<string, Set<string>>();
  for (const u of ansUni) {
    const r = u.R;
    const uniId = u.U;
    // Si el usuario no contempla privadas, filtrar Deusto y Mondragon
    if (!datos.contemplaPrivada && (uniId === 'deusto' || uniId === 'mondragon')) {
      continue;
    }
    if (!uniMap.has(r)) {
      uniMap.set(r, new Set());
    }
    uniMap.get(r)!.add(uniId);
  }

  // Procesar pasarelas
  const pasarelasList: Array<{ r: string; f: string; regla: string }> = [];
  for (const pas of ansPasarela) {
    pasarelasList.push({
      r: pas.R,
      f: pas.F,
      regla: pas.Regla,
    });
  }

  // Conjunto global de reglas disparadas
  const reglasDisparadasIds = new Set<string>();

  // Reglas de acceso
  if (ansAccesible.length > 0) {
    reglasDisparadasIds.add('R-ACC-01');
    reglasDisparadasIds.add('R-ACC-02');
  }

  // Construir catálogo de opciones disponibles
  const todasLasOpciones: OpcionRecomendada[] = [];

  // 1. Familias de FP de Grado Superior
  for (const [id, nombre] of Object.entries(NOMBRES_FAMILIAS)) {
    const afinidadBase = afinidadesMap.get(id) ?? 0;
    const letrasRechazadas = Array.from(penalizacionesMap.get(id) ?? []);
    // Puntuación final = afinidad - 1 por cada letra rechazada que contenga (regla R-RECH-01)
    const penalizacionPuntos = letrasRechazadas.length * 1.0;
    const puntuacionFinal = Math.max(0, Math.round((afinidadBase - penalizacionPuntos) * 100) / 100);

    if (letrasRechazadas.length > 0) {
      reglasDisparadasIds.add('R-RECH-01');
    }

    // Pasarelas vinculadas desde esta FP a Grados Universitarios
    const pasarelas: PasarelaDetalle[] = pasarelasList
      .filter((p) => p.f === id)
      .map((p) => {
        reglasDisparadasIds.add(p.regla);
        const uniNombre = NOMBRES_RAMAS[p.r] || p.r;
        return {
          tipo: 'fp_a_uni',
          familiaFpId: id,
          familiaFpNombre: nombre,
          ramaUniId: p.r,
          ramaUniNombre: uniNombre,
          reglaId: p.regla,
          textoExplicativo: `Camino alternativo: Grado Superior en ${nombre} y después la universidad (${uniNombre}) sin PAU obligatoria.`,
        };
      });

    todasLasOpciones.push({
      id,
      tipo: 'fp',
      nombre,
      afinidadBase,
      penalizaciones: letrasRechazadas,
      puntuacionFinal,
      reglaAcceso: 'R-ACC-01',
      universidades: [],
      avisos: [],
      consejos: [],
      pasarelas,
    });
  }

  // 2. Ramas Universitarias
  for (const [id, nombre] of Object.entries(NOMBRES_RAMAS)) {
    const afinidadBase = afinidadesMap.get(id) ?? 0;
    const letrasRechazadas = Array.from(penalizacionesMap.get(id) ?? []);
    const penalizacionPuntos = letrasRechazadas.length * 1.0;
    const puntuacionFinal = Math.max(0, Math.round((afinidadBase - penalizacionPuntos) * 100) / 100);

    if (letrasRechazadas.length > 0) {
      reglasDisparadasIds.add('R-RECH-01');
    }

    const opKey = `uni(${id})`;
    const avisos = Array.from(avisosMap.get(opKey) ?? []);
    const consejos = Array.from(consejosMap.get(opKey) ?? []);

    for (const av of avisos) reglasDisparadasIds.add(av);
    for (const co of consejos) reglasDisparadasIds.add(co);

    // Universidades disponibles
    const unis = Array.from(uniMap.get(id) ?? []).map((uniId) => ({
      id: uniId,
      nombre: NOMBRES_UNIVERSIDADES[uniId]?.nombre || uniId,
      publica: NOMBRES_UNIVERSIDADES[uniId]?.publica ?? false,
    }));

    // Pasarelas que desembocan en esta rama universitaria
    const pasarelas: PasarelaDetalle[] = pasarelasList
      .filter((p) => p.r === id)
      .map((p) => {
        reglasDisparadasIds.add(p.regla);
        const fpNombre = NOMBRES_FAMILIAS[p.f] || p.f;
        return {
          tipo: 'uni_desde_fp',
          familiaFpId: p.f,
          familiaFpNombre: fpNombre,
          ramaUniId: id,
          ramaUniNombre: nombre,
          reglaId: p.regla,
          textoExplicativo: `Camino alternativo: Grado Superior en ${fpNombre} y después la universidad sin PAU.`,
        };
      });

    todasLasOpciones.push({
      id,
      tipo: 'uni',
      nombre,
      afinidadBase,
      penalizaciones: letrasRechazadas,
      puntuacionFinal,
      reglaAcceso: 'R-ACC-02',
      universidades: unis,
      avisos,
      consejos,
      pasarelas,
    });
  }

  // Regla R-PLANO-01 si el perfil vocacional es plano
  if (perfil.esPerfilPlano) {
    reglasDisparadasIds.add('R-PLANO-01');
  }

  // Ordenación con regla de preferencia inicial:
  // "La preferencia inicial solo ordena (pone primero el tipo preferido ante empates cercanos de 0.3), no elimina opciones."
  todasLasOpciones.sort((a, b) => {
    const diff = b.puntuacionFinal - a.puntuacionFinal;
    if (Math.abs(diff) <= 0.3001) {
      if (datos.preferencia === 'fp') {
        if (a.tipo === 'fp' && b.tipo !== 'fp') return -1;
        if (b.tipo === 'fp' && a.tipo !== 'fp') return 1;
      } else if (datos.preferencia === 'uni') {
        if (a.tipo === 'uni' && b.tipo !== 'uni') return -1;
        if (b.tipo === 'uni' && a.tipo !== 'uni') return 1;
      }
    }
    return diff;
  });

  // Top 6 opciones
  const topOpciones = todasLasOpciones.slice(0, 6);

  // Recopilar lista completa de objetos ReglaInfo para las reglas disparadas
  const reglasDisparadas: ReglaDisparadaConContexto[] = Array.from(reglasDisparadasIds)
    .filter((id) => REGLAS_CATALOGO[id])
    .map((id) => ({
      ...REGLAS_CATALOGO[id],
      origen: id.startsWith('R-ACC')
        ? 'Acceso'
        : id.startsWith('R-POND')
        ? 'Ponderación PAU'
        : id.startsWith('R-PRIO')
        ? 'Modalidad'
        : id.startsWith('R-PRIV')
        ? 'Tipo Centro'
        : id.startsWith('R-CURSO')
        ? 'Momento Académico'
        : id.startsWith('R-PAS')
        ? 'Pasarela FP-Universidad'
        : 'Intereses RIASEC',
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  return {
    topOpciones,
    todasLasOpciones,
    reglasDisparadas,
    esPerfilPlano: perfil.esPerfilPlano,
    perfil,
    datosUsuario: datos,
  };
}
