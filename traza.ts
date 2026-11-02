/**
 * Módulo de generación de la Traza de Razonamiento Lógico
 * Construye de forma 100% determinista la explicación transparente del motor Prolog
 */
import { DatosUsuario, OpcionRecomendada, ReglaDisparadaConContexto, ResultadoMotor } from './motor';
import { ItemCuestionario, RespuestasCuestionario } from './perfil';
import { LISTA_MATERIAS, MODALIDADES_NOMBRES } from './types';
import { NOMBRES_LETRAS_RIASEC } from './reglas';
import { ItemCuestionarioCompleto } from './preguntasExpert';

export const CODIGOS_OPCIONES: Record<string, string[]> = {
  informatica_comunicaciones: ['c', 'i', 'r'],
  sanidad: ['r', 'i', 's', 'c'],
  administracion_gestion: ['c', 'e', 'i'],
  comercio_marketing: ['e', 'c'],
  electricidad_electronica: ['r', 'c', 'i'],
  fabricacion_mecanica: ['r', 'c', 'i'],
  instalacion_mantenimiento: ['r', 'c', 'i'],
  transporte_mantenimiento_vehiculos: ['r', 'c', 'i'],
  energia_agua: ['r', 'c', 'i'],
  edificacion_obra_civil: ['r', 'i', 'c'],
  quimica: ['i', 'r', 'c'],
  industrias_alimentarias: ['r', 'c', 'i'],
  agraria: ['r', 'i', 'c'],
  seguridad_medio_ambiente: ['r', 'i', 'c'],
  hosteleria_turismo: ['e', 'c', 'r'],
  imagen_personal: ['r', 'a', 'c'],
  imagen_sonido: ['r', 'a', 'c'],
  artes_graficas: ['a', 'c', 'r'],
  textil_confeccion_piel: ['a', 'r', 'e'],
  madera_mueble_corcho: ['r', 'c'],
  maritimo_pesquera: ['r', 'c', 'e'],
  actividades_fisicas_deportivas: ['s', 'r', 'e'],
  servicios_socioculturales: ['s', 'a', 'c'],
  artes_humanidades: ['a', 'c', 'i'],
  ciencias: ['i', 'r', 'c'],
  ciencias_salud: ['i', 's', 'r'],
  ciencias_sociales_juridicas: ['s', 'c', 'e'],
  ingenieria_arquitectura: ['r', 'i', 'a'],
};

export interface FilaRespuestaTraza {
  id: number;
  letra: string;
  texto: string;
  gusto: number;
  importancia: number;
  esRechazo: boolean;
  esAñadida: boolean;
}

export interface HechoPrologTraza {
  hecho: string;
  origen: string;
  esAñadida?: boolean;
}

export interface ReglaPrologTraza {
  id: string;
  conclusion: string;
  condicion: string;
}

export interface OpcionCalculoTraza {
  nombre: string;
  tipo: 'fp' | 'uni';
  letras: string[];
  puntuacionesLetras: number[];
  formulaMedia: string;
  afinidadBase: number;
  penalizacionesTexto: string;
  puntuacionFinal: number;
  lineaResumen: string;
}

export interface TrazaCompleta {
  paso1: {
    cursoTexto: string;
    modalidadTexto: string;
    materiasTexto: string;
    preferenciaTexto: string;
    contemplaPrivadaTexto: string;
    notaMediaTexto: string;
    respuestas: FilaRespuestaTraza[];
  };
  paso2: {
    hechos: HechoPrologTraza[];
  };
  paso3: {
    reglas: ReglaPrologTraza[];
  };
  paso4: {
    calculos: OpcionCalculoTraza[];
    explicacionOrden: string;
  };
  textoPlano: string;
}

const fmt = (n: number) => n.toFixed(1).replace('.', ',');
const fmt2 = (n: number) => n.toFixed(2).replace('.', ',');

/**
 * Construye la traza de razonamiento lógico con 4 pasos detallados
 */
export function construirTraza(
  datosUsuario: DatosUsuario,
  hechosAsertados: string | string[],
  resultadosProlog: ResultadoMotor,
  opcionesPuntuadas: OpcionRecomendada[],
  contextoExtra?: {
    respuestas?: RespuestasCuestionario;
    items?: ItemCuestionarioCompleto[];
  }
): TrazaCompleta {
  const { perfil, reglasDisparadas } = resultadosProlog;
  const respuestas = contextoExtra?.respuestas || {};
  const items = contextoExtra?.items || [];

  // ==========================================
  // PASO 1 - TUS DATOS
  // ==========================================
  const cursoTexto = `${datosUsuario.curso}.º de Bachillerato`;
  const modalidadTexto = `${MODALIDADES_NOMBRES[datosUsuario.modalidad] || datosUsuario.modalidad} (${datosUsuario.modalidad})`;

  const mapaMaterias = new Map(LISTA_MATERIAS.map((m) => [m.id, m.nombre]));
  const materiasNombres = datosUsuario.materias.map((m) => mapaMaterias.get(m) || m);
  const materiasTexto = materiasNombres.join(', ') || 'Ninguna seleccionada';

  const preferenciaTexto =
    datosUsuario.preferencia === 'fp'
      ? 'Me tira más la FP (prioridad a Grado Superior)'
      : datosUsuario.preferencia === 'uni'
      ? 'Me tira más la universidad (prioridad a Grados universitarios)'
      : 'Sin decidir (abierto a ambas vías)';

  const contemplaPrivadaTexto = datosUsuario.contemplaPrivada
    ? 'Sí, las contempla (pública UPV/EHU y privadas Deusto / Mondragon)'
    : 'Solo la pública (exclusivamente UPV/EHU)';

  const notaMediaTexto =
    datosUsuario.notaMedia !== null && datosUsuario.notaMedia !== undefined
      ? `${datosUsuario.notaMedia} (informativa)`
      : 'No indicada';

  const filasRespuestas: FilaRespuestaTraza[] = items.map((it) => {
    const r = respuestas[it.id] || { gusto: 3, importancia: 3 };
    const gusto = r.gusto ?? 3;
    const importancia = r.importancia ?? 3;
    const esRechazo = gusto <= 2 && importancia >= 4;
    return {
      id: it.id,
      letra: it.letra.toUpperCase(),
      texto: it.texto,
      gusto,
      importancia,
      esRechazo,
      esAñadida: it.origen === 'añadida',
    };
  });

  // ==========================================
  // PASO 2 - HECHOS EN PROLOG
  // ==========================================
  const hechos: HechoPrologTraza[] = [
    {
      hecho: `curso(${datosUsuario.curso}).`,
      origen: `Curso seleccionado por el estudiante: ${cursoTexto}`,
    },
    {
      hecho: `modalidad(${datosUsuario.modalidad}).`,
      origen: `Modalidad de Bachillerato elegida: ${MODALIDADES_NOMBRES[datosUsuario.modalidad] || datosUsuario.modalidad}`,
    },
    {
      hecho: `contempla_privada(${datosUsuario.contemplaPrivada ? 'si' : 'no'}).`,
      origen: `Preferencia de universidades privadas: ${contemplaPrivadaTexto}`,
    },
  ];

  // Materias
  for (const mId of datosUsuario.materias) {
    hechos.push({
      hecho: `materia(${mId}).`,
      origen: `Materia matriculada en 2.º: ${mapaMaterias.get(mId) || mId}`,
    });
  }

  // Puntuaciones RIASEC letra_usuario
  const letras: Array<'r' | 'i' | 'a' | 's' | 'e' | 'c'> = ['r', 'i', 'a', 's', 'e', 'c'];
  for (const letra of letras) {
    const punt = perfil.puntuaciones[letra];
    const itemsDeLetra = items.filter((it) => it.letra === letra);
    const formulaNumerador = itemsDeLetra
      .map((it) => {
        const r = respuestas[it.id] || { gusto: 3, importancia: 3 };
        const g = r.gusto ?? 3;
        const imp = r.importancia ?? 3;
        return `${g}×${imp}`;
      })
      .join(' + ');

    const formulaDenominador = itemsDeLetra
      .map((it) => {
        const r = respuestas[it.id] || { gusto: 3, importancia: 3 };
        return `${r.importancia ?? 3}`;
      })
      .join(' + ');

    const idsTexto = itemsDeLetra
      .map((it) => (it.origen === 'añadida' ? `${it.id} [añadida]` : `${it.id}`))
      .join(', ');

    const tieneAñadidas = itemsDeLetra.some((it) => it.origen === 'añadida');

    hechos.push({
      hecho: `letra_usuario(${letra}, ${punt}).`,
      origen: `media ponderada de los ítems ${idsTexto}: (${formulaNumerador}) / (${formulaDenominador}) = ${fmt2(punt)}`,
      esAñadida: tieneAñadidas,
    });
  }

  // Rechazos
  for (const letraRechazo of perfil.rechazos) {
    const itemsRechazo = items.filter((it) => {
      if (it.letra !== letraRechazo) return false;
      const r = respuestas[it.id];
      return r && r.gusto !== undefined && r.importancia !== undefined && r.gusto <= 2 && r.importancia >= 4;
    });

    const causas = itemsRechazo
      .map((it) => {
        const r = respuestas[it.id]!;
        const tag = it.origen === 'añadida' ? ' [añadida]' : '';
        return `ítem ${it.id}${tag} ("${it.texto}") con gusto ${r.gusto} (≤ 2) e importancia ${r.importancia} (≥ 4)`;
      })
      .join('; ');

    hechos.push({
      hecho: `rechazo(${letraRechazo}).`,
      origen: `rechazo explícito activado porque ${causas}`,
      esAñadida: itemsRechazo.some((it) => it.origen === 'añadida'),
    });
  }

  // ==========================================
  // PASO 3 - REGLAS DISPARADAS
  // ==========================================
  const reglas: ReglaPrologTraza[] = [];

  for (const r of reglasDisparadas) {
    let condicion = '';

    switch (r.id) {
      case 'R-ACC-01':
        condicion = 'porque tienes el título de Bachillerato, que da acceso directo a cualquier ciclo de Grado Superior de FP sin prueba adicional.';
        break;
      case 'R-ACC-02':
        condicion = 'porque tienes Bachillerato y superando la PAU puedes acceder a cualquier rama de Grado universitario.';
        break;
      case 'R-RECH-01': {
        const causasRechazo: string[] = [];
        for (const l of perfil.rechazos) {
          const its = items.filter((it) => {
            if (it.letra !== l) return false;
            const res = respuestas[it.id];
            return res && res.gusto !== undefined && res.importancia !== undefined && res.gusto <= 2 && res.importancia >= 4;
          });
          its.forEach((it) => {
            const res = respuestas[it.id]!;
            const tag = it.origen === 'añadida' ? ' [añadida]' : '';
            causasRechazo.push(`el ítem ${it.id}${tag} tiene gusto ${res.gusto} e importancia ${res.importancia} (dimensión ${l.toUpperCase()})`);
          });
        }
        condicion = `porque ${causasRechazo.join(', ')}. Se descuenta 1 punto a las opciones con estas letras.`;
        break;
      }
      case 'R-PRIO-01':
        condicion = `porque modalidad = ${datosUsuario.modalidad} ≠ ciencias_tecnologia (el acceso a Ingenierías y Arquitectura no tiene la prioridad formativa preferente).`;
        break;
      case 'R-POND-01': {
        const ramasAfectadas = opcionesPuntuadas
          .filter((op) => op.avisos.includes('R-POND-01'))
          .map((op) => op.nombre);
        condicion = `porque ninguna de tus materias de 2.º (${materiasTexto}) pondera 0,2 en la PAU para ${
          ramasAfectadas.length > 0 ? ramasAfectadas.join(', ') : 'esta rama universitaria'
        }.`;
        break;
      }
      case 'R-PRIV-01':
        condicion = 'porque contempla_privada = si y las titulaciones recomendadas se ofertan en universidades privadas de Euskadi (Universidad de Deusto o Mondragon Unibertsitatea).';
        break;
      case 'R-CURSO-01':
        condicion = 'porque curso = 1 y se disparó R-POND-01 (al estar cursando 1.º de Bachillerato, aún puedes elegir en 2.º materias que ponderen 0,2).';
        break;
      case 'R-CURSO-02':
        condicion = 'porque curso = 2 y se disparó R-POND-01 (al estar cursando 2.º de Bachillerato, conviene asegurar nota global o valorar la pasarela desde FP).';
        break;
      case 'R-PAS-01': {
        const pasarelasActivas = opcionesPuntuadas
          .flatMap((op) => op.pasarelas)
          .map((p) => `${p.familiaFpNombre} → ${p.ramaUniNombre}`);
        const unicas = Array.from(new Set(pasarelasActivas));
        condicion = `porque existe vinculación formativa directa entre Ciclos de FP y la universidad (${unicas.join('; ')}), permitiendo entrar al grado sin PAU.`;
        break;
      }
      case 'R-PLANO-01': {
        const letra1 = perfil.ranking[0].letra.toUpperCase();
        const punt1 = fmt(perfil.ranking[0].puntuacion);
        const letra3 = perfil.ranking[2].letra.toUpperCase();
        const punt3 = fmt(perfil.ranking[2].puntuacion);
        condicion = `porque 1.ª letra ${letra1} (${punt1}) − 3.ª letra ${letra3} (${punt3}) = ${fmt2(perfil.diferenciaTop1Top3)} < 0,5 (intereses polivalentes y equilibrados).`;
        break;
      }
      default:
        condicion = `porque se verificaron las condiciones lógicas de la regla ${r.id} en la base de conocimiento.`;
    }

    reglas.push({
      id: r.id,
      conclusion: r.nombre,
      condicion,
    });
  }

  // ==========================================
  // PASO 4 - CÁLCULO DE CADA OPCIÓN MOSTRADA
  // ==========================================
  const calculos: OpcionCalculoTraza[] = opcionesPuntuadas.map((op) => {
    const letrasCodigo = CODIGOS_OPCIONES[op.id] || [];
    const puntuacionesLetras = letrasCodigo.map((l) => perfil.puntuaciones[l as 'r' | 'i' | 'a' | 's' | 'e' | 'c'] ?? 0);
    const sumaPuntos = puntuacionesLetras.reduce((acc, v) => acc + v, 0);
    const n = puntuacionesLetras.length;
    const mediaPuntos = n > 0 ? Math.round((sumaPuntos / n) * 100) / 100 : 0;

    const letrasStr = letrasCodigo.map((l) => l.toUpperCase()).join(' ');
    const sumaFormula = `(${puntuacionesLetras.map(fmt).join(' + ')}) / ${n}`;
    const afinidadBase = op.afinidadBase;

    let penalizacionesTexto = 'sin penalización';
    if (op.penalizaciones.length > 0) {
      const letrasRechazadasStr = op.penalizaciones.map((l) => l.toUpperCase()).join(' y ');
      penalizacionesTexto = `−${op.penalizaciones.length} por rechazo de ${letrasRechazadasStr}`;
    }

    // Formato exacto del prompt:
    // "Sanidad: R I S C → (2,1 + 3,0 + 4,6 + 1,2) / 4 = 2,73; −1 por rechazo de C → 1,73"
    const lineaResumen = `${op.nombre}: ${letrasStr} → ${sumaFormula} = ${fmt2(afinidadBase)}; ${penalizacionesTexto} → ${fmt2(
      op.puntuacionFinal
    )}`;

    return {
      nombre: op.nombre,
      tipo: op.tipo,
      letras: letrasCodigo.map((l) => l.toUpperCase()),
      puntuacionesLetras,
      formulaMedia: `${sumaFormula} = ${fmt2(afinidadBase)}`,
      afinidadBase,
      penalizacionesTexto,
      puntuacionFinal: op.puntuacionFinal,
      lineaResumen,
    };
  });

  // Explicación de la ordenación final
  let explicacionOrden = 'Orden final: ordenadas por puntuación final de mayor a menor.';
  if (datosUsuario.preferencia !== 'sin_decidir') {
    const prefNombre = datosUsuario.preferencia === 'fp' ? 'FP de Grado Superior' : 'Grado universitario';
    explicacionOrden += ` Preferencia del estudiante: ${prefNombre}. Ante diferencias menores o iguales a 0,3 puntos entre opciones contiguas, se prioriza el tipo preferido sin descartar ninguna opción.`;
  } else {
    explicacionOrden += ' Sin preferencia inicial (abierto a FP y Universidad), orden puramente por afinidad matemática.';
  }

  // ==========================================
  // TEXTO PLANO PARA COPIAR AL PORTAPAPELES
  // ==========================================
  const lineasTexto: string[] = [
    '=== TRAZA DE RAZONAMIENTO DEL SISTEMA EXPERTO ===',
    'ORIENTADOR FP Y UNIVERSIDAD (EUSKADI 2026-2027)',
    '',
    '--- PASO 1: TUS DATOS ---',
    `• Curso: ${cursoTexto}`,
    `• Modalidad: ${modalidadTexto}`,
    `• Materias de 2.º: ${materiasTexto}`,
    `• Preferencia inicial: ${preferenciaTexto}`,
    `• Universidades privadas: ${contemplaPrivadaTexto}`,
    `• Nota media aproximada: ${notaMediaTexto}`,
    '',
    'Respuestas al cuestionario vocacional:',
    'Ítem | Letra | Gusto | Import. | Actividad',
    '------------------------------------------------',
  ];

  filasRespuestas.forEach((f) => {
    const tag = f.esAñadida ? ' [Añadida]' : '';
    const rechazoTag = f.esRechazo ? ' [Rechazo]' : '';
    lineasTexto.push(
      `#${f.id.toString().padStart(2, '0')}${tag} | ${f.letra} | ${f.gusto}/5 | ${f.importancia}/5 | ${f.texto}${rechazoTag}`
    );
  });

  lineasTexto.push(
    '',
    '--- PASO 2: HECHOS EN PROLOG ---',
    'Lista literal de hechos asertados en Tau-Prolog y su origen:'
  );

  hechos.forEach((h) => {
    lineasTexto.push(`${h.hecho.padEnd(35, ' ')} ← ${h.origen}`);
  });

  lineasTexto.push(
    '',
    '--- PASO 3: REGLAS DISPARADAS ---',
    'Reglas normativas y vocacionales cumplidas para tu expediente:'
  );

  reglas.forEach((r) => {
    lineasTexto.push(`• [${r.id}] ${r.conclusion}`);
    lineasTexto.push(`  Condición: ${r.condicion}`);
  });

  lineasTexto.push(
    '',
    '--- PASO 4: CÁLCULO DE CADA OPCIÓN MOSTRADA ---',
    'Cálculo de afinidad base, penalizaciones por rechazo y puntuación final:'
  );

  calculos.forEach((c) => {
    lineasTexto.push(`• ${c.lineaResumen}`);
  });

  lineasTexto.push('', explicacionOrden);

  return {
    paso1: {
      cursoTexto,
      modalidadTexto,
      materiasTexto,
      preferenciaTexto,
      contemplaPrivadaTexto,
      notaMediaTexto,
      respuestas: filasRespuestas,
    },
    paso2: {
      hechos,
    },
    paso3: {
      reglas,
    },
    paso4: {
      calculos,
      explicacionOrden,
    },
    textoPlano: lineasTexto.join('\n'),
  };
}
