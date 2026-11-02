/**
 * Cálculo del perfil vocacional RIASEC y generación de hechos para Prolog
 */

export type LetraRIASEC = 'r' | 'i' | 'a' | 's' | 'e' | 'c';

export interface ItemCuestionario {
  id: number;
  letra: LetraRIASEC;
  texto: string;
}

export const ITEMS_CUESTIONARIO: ItemCuestionario[] = [
  // R - Realista
  { id: 1, letra: 'r', texto: 'Montar, reparar o ajustar aparatos y máquinas' },
  { id: 2, letra: 'r', texto: 'Construir o fabricar objetos con las manos' },
  { id: 3, letra: 'r', texto: 'Trabajar al aire libre o con actividad física' },

  // I - Investigador
  { id: 4, letra: 'i', texto: 'Investigar por qué ocurre un fenómeno científico' },
  { id: 5, letra: 'i', texto: 'Resolver problemas difíciles de matemáticas o lógica' },
  { id: 6, letra: 'i', texto: 'Hacer experimentos y analizar sus resultados' },

  // A - Artístico
  { id: 7, letra: 'a', texto: 'Dibujar, diseñar o crear contenido visual' },
  { id: 8, letra: 'a', texto: 'Escribir historias, componer música o actuar' },
  { id: 9, letra: 'a', texto: 'Proponer ideas originales en vez de seguir instrucciones fijas' },

  // S - Social
  { id: 10, letra: 's', texto: 'Explicar cosas a otras personas o ayudarles a aprender' },
  { id: 11, letra: 's', texto: 'Cuidar de personas que lo necesitan' },
  { id: 12, letra: 's', texto: 'Escuchar y aconsejar a alguien que tiene un problema' },

  // E - Emprendedor
  { id: 13, letra: 'e', texto: 'Dirigir un grupo para que cumpla un objetivo' },
  { id: 14, letra: 'e', texto: 'Convencer a otros de una idea o vender un producto' },
  { id: 15, letra: 'e', texto: 'Montar mi propio proyecto o negocio' },

  // C - Convencional
  { id: 16, letra: 'c', texto: 'Organizar datos, archivos o información en tablas' },
  { id: 17, letra: 'c', texto: 'Seguir procedimientos claros y revisar que todo esté correcto' },
  { id: 18, letra: 'c', texto: 'Llevar las cuentas o gestionar un presupuesto' },
];

export interface RespuestaItem {
  gusto?: number; // 1 a 5
  importancia?: number; // 1 a 5
}

export type RespuestasCuestionario = Record<number, RespuestaItem>;

export interface PuntuacionLetra {
  letra: LetraRIASEC;
  puntuacion: number;
  rechazada: boolean;
}

export interface ResultadoPerfil {
  puntuaciones: Record<LetraRIASEC, number>;
  ranking: PuntuacionLetra[];
  rechazos: LetraRIASEC[];
  esPerfilPlano: boolean;
  diferenciaTop1Top3: number;
  hechosProlog: string;
}

/**
 * Calcula las puntuaciones del perfil RIASEC a partir de las respuestas del cuestionario
 */
export function calcularPerfil(
  respuestas: RespuestasCuestionario,
  itemsPersonalizados?: ItemCuestionario[]
): ResultadoPerfil {
  const items = itemsPersonalizados && itemsPersonalizados.length > 0 ? itemsPersonalizados : ITEMS_CUESTIONARIO;
  const letras: LetraRIASEC[] = ['r', 'i', 'a', 's', 'e', 'c'];
  const puntuaciones: Record<LetraRIASEC, number> = {
    r: 0,
    i: 0,
    a: 0,
    s: 0,
    e: 0,
    c: 0,
  };
  const rechazosSet = new Set<LetraRIASEC>();

  for (const letra of letras) {
    const itemsLetra = items.filter((item) => item.letra === letra);
    let sumaPonderada = 0;
    let sumaImportancia = 0;

    for (const item of itemsLetra) {
      const resp = respuestas[item.id] || { gusto: 3, importancia: 3 };
      const gusto = resp.gusto ?? 3;
      const importancia = resp.importancia ?? 3;

      sumaPonderada += gusto * importancia;
      sumaImportancia += importancia;

      // Rechazo: si algún ítem tiene gusto <= 2 e importancia >= 4
      if (gusto <= 2 && importancia >= 4) {
        rechazosSet.add(letra);
      }
    }

    const mediaPonderada = sumaImportancia > 0 ? sumaPonderada / sumaImportancia : 0;
    puntuaciones[letra] = Math.round(mediaPonderada * 100) / 100;
  }

  const rechazos = Array.from(rechazosSet);

  // Ordenar de mayor a menor puntuación
  const ranking: PuntuacionLetra[] = letras
    .map(letra => ({
      letra,
      puntuacion: puntuaciones[letra],
      rechazada: rechazosSet.has(letra),
    }))
    .sort((a, b) => b.puntuacion - a.puntuacion);

  // Perfil plano: si la diferencia entre la 1.ª y la 3.ª letra es menor que 0.5 (regla R-PLANO-01)
  const diferenciaTop1Top3 = Math.round((ranking[0].puntuacion - ranking[2].puntuacion) * 100) / 100;
  const esPerfilPlano = diferenciaTop1Top3 < 0.5;

  // Construcción de hechos Prolog
  const lineasHechos: string[] = [];
  for (const letra of letras) {
    lineasHechos.push(`letra_usuario(${letra}, ${puntuaciones[letra]}).`);
  }
  for (const letra of rechazos) {
    lineasHechos.push(`rechazo(${letra}).`);
  }

  return {
    puntuaciones,
    ranking,
    rechazos,
    esPerfilPlano,
    diferenciaTop1Top3,
    hechosProlog: lineasHechos.join('\n'),
  };
}
