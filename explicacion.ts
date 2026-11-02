/**
 * Generación y validación de la explicación del resultado de orientación
 * Soporta llamada a Gemini Flash con verificación estricta y fallback a plantilla determinista
 */
import { NOMBRES_FAMILIAS, NOMBRES_RAMAS, NOMBRES_LETRAS_RIASEC } from './reglas';
import { ResultadoMotor } from './motor';

export interface PayloadExplicacion {
  perfil: Record<string, number>;
  rechazos: string[];
  opciones: Array<{
    posicion: number;
    id: string;
    nombre: string;
    tipo: 'fp' | 'uni';
    puntuacion_final: number;
    afinidad_base: number;
    penalizada: boolean;
  }>;
  reglas_disparadas: Array<{
    id: string;
    nombre: string;
  }>;
  avisos: string[];
}

export interface RespuestaExplicacion {
  texto: string;
  tipo: 'gemini' | 'plantilla';
  advertenciaValidacion?: string;
}

/**
 * Prepara el JSON cerrado y estricto requerido para la explicación
 */
export function prepararPayload(resultado: ResultadoMotor): PayloadExplicacion {
  return {
    perfil: resultado.perfil.puntuaciones,
    rechazos: resultado.perfil.rechazos,
    opciones: resultado.topOpciones.map((op, idx) => ({
      posicion: idx + 1,
      id: op.id,
      nombre: op.nombre,
      tipo: op.tipo,
      puntuacion_final: op.puntuacionFinal,
      afinidad_base: op.afinidadBase,
      penalizada: op.penalizaciones.length > 0,
    })),
    reglas_disparadas: resultado.reglasDisparadas.map((r) => ({
      id: r.id,
      nombre: r.nombre,
    })),
    avisos: Array.from(
      new Set(resultado.topOpciones.flatMap((op) => op.avisos.concat(op.consejos)))
    ),
  };
}

/**
 * Genera una explicación estructurada de plantilla basada estrictamente en las reglas disparadas
 */
export function explicacionPlantilla(resultado: ResultadoMotor): string {
  const { topOpciones, perfil, datosUsuario, reglasDisparadas } = resultado;

  const top3Letras = perfil.ranking
    .slice(0, 3)
    .map((r) => NOMBRES_LETRAS_RIASEC[r.letra]?.nombre || r.letra.toUpperCase())
    .join(', ');

  const primeraOpcion = topOpciones[0];
  const segundaOpcion = topOpciones[1];
  const terceraOpcion = topOpciones[2];

  const rechazosTexto =
    perfil.rechazos.length > 0
      ? ` Has descartado expresamente actividades del ámbito ${perfil.rechazos
          .map((l) => NOMBRES_LETRAS_RIASEC[l]?.nombre || l.toUpperCase())
          .join(', ')}, lo que ha penalizado las alternativas con esa carga.`
      : '';

  const flatBanner = perfil.esPerfilPlano
    ? ' Al tener intereses muy equilibrados, tus resultados combinan áreas técnicas y de gestión afines a tu versatilidad.'
    : '';

  const consejosTexto = reglasDisparadas.some((r) => r.id === 'R-CURSO-01')
    ? ' Al estar en 1.º de Bachillerato, revisa bien qué optativas de 2.º ponderan en la universidad para acceder con la mejor nota posible.'
    : reglasDisparadas.some((r) => r.id === 'R-CURSO-02')
    ? ' Al estar en 2.º, ten muy presente la pasarela directa desde un Grado Superior afín para entrar a la carrera sin repetir la PAU.'
    : '';

  const pasarelaTexto = topOpciones.some((o) => o.pasarelas.length > 0)
    ? ' Cuentas además con itinerarios en pasarela directa desde Ciclos Formativos de Grado Superior hacia grados universitarios vinculados.'
    : '';

  return (
    `Analizando tus respuestas, tus dimensiones vocacionales predominantes son ${top3Letras}.${rechazosTexto}${flatBanner} ` +
    `Por este motivo, tu itinerario más compatible es ${primeraOpcion?.nombre || ''} ` +
    `(${primeraOpcion?.tipo === 'fp' ? 'Formación Profesional' : 'Universidad'}, ${primeraOpcion?.puntuacionFinal.toFixed(2)} pts), ` +
    `seguido de ${segundaOpcion?.nombre || ''} y ${terceraOpcion?.nombre || ''}.` +
    `${consejosTexto}${pasarelaTexto} Estas recomendaciones se basan estrictamente en tu afinidad real y la normativa académica del País Vasco.`
  );
}

/**
 * Valida la respuesta de Gemini:
 * Si menciona alguna familia de FP o rama universitaria que NO esté en el JSON, la respuesta se descarta.
 */
export function validarTextoExplicacion(
  texto: string,
  payload: PayloadExplicacion
): { valido: boolean; motivo?: string } {
  if (!texto || texto.trim().length < 50) {
    return { valido: false, motivo: 'Texto demasiado breve o vacío' };
  }

  const textoLower = texto.toLowerCase();

  // Nombres de las opciones incluidas en el JSON (permitidas)
  const nombresPermitidos = new Set(payload.opciones.map((o) => o.nombre.toLowerCase()));

  // Verificar todas las familias de FP existentes
  for (const [id, nombreCompleto] of Object.entries(NOMBRES_FAMILIAS)) {
    const nombreLower = nombreCompleto.toLowerCase();
    if (!nombresPermitidos.has(nombreLower)) {
      // Si la palabra clave principal de una familia NO permitida aparece en el texto
      // Evitar falsos positivos con palabras comunes comprobando el nombre o término característico
      if (textoLower.includes(nombreLower)) {
        return {
          valido: false,
          motivo: `Menciona la familia no recomendada: "${nombreCompleto}"`,
        };
      }
    }
  }

  // Verificar ramas universitarias existentes
  for (const [id, nombreCompleto] of Object.entries(NOMBRES_RAMAS)) {
    const nombreLower = nombreCompleto.toLowerCase();
    if (!nombresPermitidos.has(nombreLower)) {
      if (textoLower.includes(nombreLower)) {
        return {
          valido: false,
          motivo: `Menciona la rama no recomendada: "${nombreCompleto}"`,
        };
      }
    }
  }

  return { valido: true };
}

/**
 * Obtiene la explicación para el estudiante comunicándose con el endpoint del servidor
 * o retrocediendo a la plantilla segura si falla la red, la IA o la validación.
 */
export async function obtenerExplicacion(
  resultado: ResultadoMotor
): Promise<RespuestaExplicacion> {
  const payload = prepararPayload(resultado);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch('/api/explicacion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('La llamada al servidor de explicación no fue exitosa. Usando plantilla.');
      return {
        texto: explicacionPlantilla(resultado),
        tipo: 'plantilla',
      };
    }

    const data = await response.json();
    const textoGenerado: string = data.explicacion || '';

    // Validar rigurosamente que no invente opciones ajenas
    const validacion = validarTextoExplicacion(textoGenerado, payload);
    if (!validacion.valido) {
      console.warn('Explicación descartada por validación:', validacion.motivo);
      return {
        texto: explicacionPlantilla(resultado),
        tipo: 'plantilla',
        advertenciaValidacion: validacion.motivo,
      };
    }

    return {
      texto: textoGenerado.trim(),
      tipo: 'gemini',
    };
  } catch (error) {
    console.error('Error al solicitar explicación de Gemini, aplicando plantilla:', error);
    return {
      texto: explicacionPlantilla(resultado),
      tipo: 'plantilla',
    };
  }
}
