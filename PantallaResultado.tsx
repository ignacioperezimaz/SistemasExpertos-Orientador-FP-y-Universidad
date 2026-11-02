import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRightLeft,
  Check,
  ChevronDown,
  Copy,
  FileText,
  Info,
  Printer,
  RotateCcw,
  TriangleAlert,
} from 'lucide-react';
import { OpcionRecomendada, ResultadoMotor } from '../motor';
import { RespuestaExplicacion, obtenerExplicacion } from '../explicacion';
import { NOMBRES_LETRAS_RIASEC } from '../reglas';
import { MODALIDADES_NOMBRES } from '../types';
import { RespuestasCuestionario } from '../perfil';
import { ItemCuestionarioCompleto } from '../preguntasExpert';
import { construirTraza } from '../traza';

interface PantallaResultadoProps {
  resultado: ResultadoMotor;
  onReiniciar: () => void;
  onModificarRespuestas: () => void;
  respuestas?: RespuestasCuestionario;
  items?: ItemCuestionarioCompleto[];
}

const fmtPuntos = (v: number) =>
  new Intl.NumberFormat('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

const nombreLetra = (letra: string) => NOMBRES_LETRAS_RIASEC[letra]?.nombre.replace(/ \(.\)$/, '') ?? letra;

const tipoOpcion = (op: OpcionRecomendada) => (op.tipo === 'uni' ? 'Grado universitario' : 'FP de Grado Superior');

const TEXTO_AVISO: Record<string, string> = {
  'R-POND-01': 'Ninguna de tus materias de 2.º pondera 0,2 en la PAU para esta rama.',
  'R-PRIO-01': 'Tu modalidad no es Ciencias y Tecnología: el acceso a Ingenierías y Arquitectura no es preferente.',
  'R-PRIV-01': 'También se oferta en universidades privadas de Euskadi (Deusto, Mondragon).',
};

const TEXTO_CONSEJO: Record<string, string> = {
  'R-CURSO-01': 'Estás en 1.º: aún puedes elegir en 2.º materias que ponderen 0,2 para esta rama.',
  'R-CURSO-02': 'Estás en 2.º: asegura tu nota global o valora la pasarela desde un Grado Superior afín.',
};

const TituloPanel: React.FC<{ children: React.ReactNode; extra?: React.ReactNode }> = ({ children, extra }) => (
  <div className="flex items-baseline justify-between gap-4">
    <h2 className="text-[14px] font-medium text-ink">{children}</h2>
    {extra && <span className="text-[13px] text-muted">{extra}</span>}
  </div>
);

/** Detalle de la opción elegida en la lista. */
const DetalleOpcion: React.FC<{ opcion: OpcionRecomendada; posicion: number }> = ({ opcion, posicion }) => {
  const esUni = opcion.tipo === 'uni';
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[13px] text-muted">
          Opción {posicion} · {tipoOpcion(opcion)}
        </p>
        <h3 className="mt-1 text-[22px] font-medium leading-7 text-ink">{opcion.nombre}</h3>
        <p className="mt-4 flex items-baseline gap-2">
          <span className="num text-[32px] leading-none text-ink">{fmtPuntos(opcion.puntuacionFinal)}</span>
          <span className="text-muted">de 5 de afinidad</span>
        </p>
        {opcion.penalizaciones.length > 0 && (
          <p className="num mt-2 text-[13px] text-muted">
            {fmtPuntos(opcion.afinidadBase)} de base,{' '}
            <span className="text-negative">
              −{opcion.penalizaciones.length} por rechazo en{' '}
              {opcion.penalizaciones.map((l) => nombreLetra(l).toLowerCase()).join(' y ')}
            </span>
          </p>
        )}
      </div>

      <div>
        <h4 className="text-[13px] text-muted">{esUni ? 'Dónde estudiarlo en Euskadi' : 'Cómo se entra'}</h4>
        {esUni ? (
          opcion.universidades.length > 0 ? (
            <ul className="mt-2">
              {opcion.universidades.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-3 border-b border-rule py-2.5 last:border-0">
                  <span className="text-ink">{u.nombre}</span>
                  <span className="flex-none whitespace-nowrap rounded-full bg-[#f3f3f3] px-2.5 py-0.5 text-[12px] text-[#3d3d3a]">
                    {u.publica ? 'Pública' : 'Privada'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 rounded-[10px] border border-dashed border-control px-3 py-2.5 text-[13px] text-muted">
              Ninguna universidad encaja con tus filtros (has elegido solo la pública).
            </p>
          )
        ) : (
          <p className="mt-2 text-ink">
            Con el título de Bachillerato, desde cualquier modalidad y sin prueba de acceso.
          </p>
        )}
      </div>

      {(opcion.avisos.length > 0 || opcion.consejos.length > 0) && (
        <ul className="space-y-2">
          {opcion.avisos.map((av) => (
            <li
              key={av}
              className="flex gap-2.5 rounded-[12px] border border-warning-line bg-warning-soft px-3.5 py-2.5 text-[13px] leading-[18px] text-warning"
            >
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 flex-none" aria-hidden="true" />
              <span>{TEXTO_AVISO[av] ?? av}</span>
            </li>
          ))}
          {opcion.consejos.map((co) => (
            <li key={co} className="flex gap-2.5 px-0.5 text-[13px] leading-[18px] text-ink">
              <Info className="mt-0.5 h-3.5 w-3.5 flex-none text-muted" aria-hidden="true" />
              <span>{TEXTO_CONSEJO[co] ?? co}</span>
            </li>
          ))}
        </ul>
      )}

      {opcion.pasarelas.length > 0 && (
        <div className="rounded-[12px] bg-accent-soft px-4 py-3">
          <p className="flex items-center gap-2 text-[13px] font-medium text-accent">
            <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Camino alternativo
          </p>
          <ul className="mt-1.5 space-y-1 text-[13px] leading-[18px] text-ink">
            {opcion.pasarelas.slice(0, 2).map((pas) => (
              <li key={pas.familiaFpId + pas.ramaUniId}>
                {esUni
                  ? `Grado Superior en ${pas.familiaFpNombre} y después la universidad sin PAU.`
                  : `Después del ciclo, a la universidad (${pas.ramaUniNombre}) sin PAU.`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export const PantallaResultado: React.FC<PantallaResultadoProps> = ({
  resultado,
  onReiniciar,
  onModificarRespuestas,
  respuestas,
  items,
}) => {
  const [explicacion, setExplicacion] = useState<RespuestaExplicacion | null>(null);
  const [cargandoExplicacion, setCargandoExplicacion] = useState(true);
  const [seleccion, setSeleccion] = useState(0);
  const [copiadoTraza, setCopiadoTraza] = useState(false);
  const detalleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let montado = true;
    setCargandoExplicacion(true);
    obtenerExplicacion(resultado)
      .then((res) => {
        if (montado) setExplicacion(res);
      })
      .catch((err) => console.error('Error al obtener la explicación:', err))
      .finally(() => {
        if (montado) setCargandoExplicacion(false);
      });
    return () => {
      montado = false;
    };
  }, [resultado]);

  const { topOpciones, todasLasOpciones, reglasDisparadas, perfil, esPerfilPlano, datosUsuario } = resultado;
  const principal = topOpciones[0];
  const codigo = perfil.ranking
    .slice(0, 3)
    .map((l) => l.letra.toUpperCase())
    .join('');
  const elegida = topOpciones[seleccion] ?? principal;

  const elegirOpcion = (i: number) => {
    setSeleccion(i);
    if (window.matchMedia('(max-width: 767px)').matches) {
      requestAnimationFrame(() => detalleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  };

  // Construir la traza de razonamiento 100% determinista sin Gemini
  const traza = useMemo(() => {
    return construirTraza(
      datosUsuario,
      perfil.hechosProlog,
      resultado,
      topOpciones,
      { respuestas, items }
    );
  }, [datosUsuario, perfil.hechosProlog, resultado, topOpciones, respuestas, items]);

  const handleCopiarTraza = async () => {
    try {
      await navigator.clipboard.writeText(traza.textoPlano);
      setCopiadoTraza(true);
      setTimeout(() => setCopiadoTraza(false), 2500);
    } catch (err) {
      console.error('Error al copiar la traza al portapapeles:', err);
    }
  };

  return (
    <div>
      {/* Cabecera solo para la versión impresa */}
      <p className="print-only hidden pb-4 text-[12px] text-muted">
        Informe de orientación · {datosUsuario.curso}.º de Bachillerato,{' '}
        {MODALIDADES_NOMBRES[datosUsuario.modalidad] || datosUsuario.modalidad} · curso 2026-2027
      </p>

      {/* Título: la respuesta en una frase */}
      <div className="flex flex-col gap-6 pb-10 md:flex-row md:items-end md:justify-between">
        <div className="max-w-[760px]">
          <h1 className="font-serif text-[36px] leading-[1.05] tracking-[-0.01em] text-ink sm:text-[48px]">
            Lo tuyo apunta a {principal.nombre}
          </h1>
          <p className="mt-4 text-[16px] leading-6 text-muted">
            {tipoOpcion(principal)}, con {fmtPuntos(principal.puntuacionFinal)} de 5 de afinidad. Tu código
            vocacional es {codigo}: {perfil.ranking.slice(0, 3).map((l) => nombreLetra(l.letra).toLowerCase()).join(', ')}.
          </p>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-5 font-medium text-white transition-colors hover:bg-black active:scale-[0.98]"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            Imprimir
          </button>
          <button
            type="button"
            onClick={onModificarRespuestas}
            className="inline-flex h-10 items-center rounded-full border border-control px-5 text-ink transition-colors hover:border-ink active:scale-[0.98]"
          >
            Cambiar respuestas
          </button>
        </div>
      </div>

      <div className="grid items-start gap-4 md:grid-cols-12">
        {/* Las seis opciones */}
        <section className="rounded-[22px] bg-surface p-5 md:col-span-7">
          <TituloPanel extra="Por afinidad, de 0 a 5">Tus seis mejores opciones</TituloPanel>
          <ol className="mt-3 space-y-0.5">
            {topOpciones.map((op, i) => {
              const activa = i === seleccion;
              return (
                <li key={op.id}>
                  <button
                    type="button"
                    onClick={() => elegirOpcion(i)}
                    aria-pressed={activa}
                    className={`flex min-h-[63px] w-full items-center gap-3 rounded-[14px] px-3 text-left transition-colors ${
                      activa ? 'bg-active' : 'hover:bg-[#f1f1f0]'
                    }`}
                  >
                    <span className="num w-5 flex-none text-muted">{i + 1}.</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] text-ink">{op.nombre}</span>
                      <span className="block truncate text-[13px] text-muted">
                        {tipoOpcion(op)}
                        {op.tipo === 'uni' && op.universidades.length > 0 &&
                          ` · ${op.universidades.length} ${op.universidades.length === 1 ? 'universidad' : 'universidades'}`}
                        {op.pasarelas.length > 0 && ' · con pasarela'}
                      </span>
                    </span>
                    <span className="flex flex-none flex-col items-end gap-1.5">
                      <span className={`num text-[16px] ${i === 0 ? 'text-accent' : 'text-ink'}`}>
                        {fmtPuntos(op.puntuacionFinal)}
                      </span>
                      <span className="block h-1 w-16 overflow-hidden rounded-full bg-line" aria-hidden="true">
                        <span
                          className={`block h-full rounded-full ${i === 0 ? 'bg-accent' : 'bg-[#8c8c88]'}`}
                          style={{ width: `${(op.puntuacionFinal / 5) * 100}%` }}
                        />
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <details className="no-print group mt-3">
            <summary className="flex cursor-pointer list-none items-center gap-1 px-3 py-2 text-[13px] text-muted hover:text-ink [&::-webkit-details-marker]:hidden">
              Ver las {todasLasOpciones.length} opciones analizadas
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <ol className="mt-1 px-3">
              {todasLasOpciones.slice(topOpciones.length).map((op, idx) => (
                <li key={op.id} className="flex items-center gap-3 border-b border-rule py-2 text-[13px] last:border-0">
                  <span className="num w-6 flex-none text-muted">{idx + topOpciones.length + 1}.</span>
                  <span className="min-w-0 flex-1 truncate text-ink">{op.nombre}</span>
                  <span className="hidden flex-none text-muted sm:inline">{op.tipo === 'uni' ? 'Grado' : 'FP'}</span>
                  <span className="num w-10 flex-none text-right text-ink">{fmtPuntos(op.puntuacionFinal)}</span>
                </li>
              ))}
            </ol>
          </details>
        </section>

        {/* Detalle de la opción elegida */}
        <section
          ref={detalleRef}
          aria-live="polite"
          className="scroll-mt-4 rounded-[22px] border border-line bg-raised p-5 md:col-span-5"
        >
          <DetalleOpcion opcion={elegida} posicion={seleccion + 1} />
        </section>

        {/* Perfil RIASEC */}
        <section className="rounded-[22px] bg-surface p-5 md:col-span-6">
          <TituloPanel extra="Gusto ponderado por importancia, de 1 a 5">Tu perfil</TituloPanel>
          <p className="mt-4 flex items-baseline gap-3">
            <span className="font-serif text-[40px] leading-none tracking-[0.02em] text-accent">{codigo}</span>
            <span className="text-muted">tu código vocacional</span>
          </p>

          {esPerfilPlano && (
            <p className="mt-4 rounded-[12px] border border-warning-line bg-warning-soft px-3.5 py-2.5 text-[13px] leading-[18px] text-warning">
              Tus intereses están muy repartidos: entre tu primera y tu tercera área hay solo{' '}
              {fmtPuntos(perfil.diferenciaTop1Top3)} puntos. Te mostramos opciones que encajan con todos.
            </p>
          )}

          <ul className="mt-5 space-y-3.5">
            {perfil.ranking.map((it, i) => {
              const top = i < 3;
              return (
                <li key={it.letra}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="flex items-center gap-2 text-ink">
                      {nombreLetra(it.letra)}
                      {it.rechazada && (
                        <span className="flex-none whitespace-nowrap rounded-full bg-negative-soft px-2 py-px text-[12px] text-negative-ink">
                          Rechazo
                        </span>
                      )}
                    </span>
                    <span className="num text-ink">{fmtPuntos(it.puntuacion)}</span>
                  </div>
                  <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
                    <span
                      className={`block h-full rounded-full ${
                        it.rechazada ? 'bg-negative' : top ? 'bg-accent' : 'bg-[#8c8c88]'
                      }`}
                      style={{ width: `${(it.puntuacion / 5) * 100}%` }}
                    />
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Explicación redactada */}
        <section className="rounded-[22px] bg-surface p-5 md:col-span-6">
          <TituloPanel>Lo que te diría tu orientador</TituloPanel>
          {cargandoExplicacion ? (
            <div className="mt-4 space-y-3" aria-label="Redactando la explicación">
              {[92, 100, 84, 96, 60].map((w, i) => (
                <span key={i} className="block h-3.5 rounded bg-line" style={{ width: `${w}%` }} />
              ))}
            </div>
          ) : (
            <p className="mt-4 whitespace-pre-line text-[15px] leading-6 text-ink">{explicacion?.texto}</p>
          )}
          <p className="mt-5 text-[12px] text-muted">
            {cargandoExplicacion
              ? 'Redactando con tus datos…'
              : explicacion?.tipo === 'gemini'
              ? 'Redactado por IA (Gemini) solo con tus resultados, sin añadir opciones.'
              : 'Redactado a partir de las reglas del sistema.'}
          </p>
        </section>

        {/* Reglas aplicadas */}
        <section className="rounded-[22px] bg-surface p-5 md:col-span-12">
          <TituloPanel extra={`${reglasDisparadas.length} reglas`}>Por qué te sale esto</TituloPanel>
          <ul className="mt-4 grid gap-x-8 md:grid-cols-2">
            {reglasDisparadas.map((regla) => (
              <li key={regla.id} className="border-b border-rule py-3.5 last:border-0 md:[&:nth-last-child(2):nth-child(odd)]:border-0">
                <p className="flex items-baseline justify-between gap-3">
                  <span className="font-medium text-ink">{regla.nombre}</span>
                  <span className="flex-none text-[12px] text-muted">{regla.id}</span>
                </p>
                <p className="mt-1 text-[13px] leading-[19px] text-muted">{regla.descripcion}</p>
              </li>
            ))}
          </ul>

          <details className="no-print group mt-3">
            <summary className="flex cursor-pointer list-none items-center gap-1 py-2 text-[13px] text-muted hover:text-ink [&::-webkit-details-marker]:hidden">
              Ver los hechos que se le pasan al motor Prolog
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <pre className="mt-2 overflow-x-auto rounded-[12px] bg-raised p-4 font-mono text-[12px] leading-5 text-ink">
{`curso(${datosUsuario.curso}).
modalidad(${datosUsuario.modalidad}).
contempla_privada(${datosUsuario.contemplaPrivada ? 'si' : 'no'}).
${datosUsuario.materias.map((m) => `materia(${m}).`).join('\n')}
${perfil.hechosProlog}`}
            </pre>
          </details>
        </section>

        {/* ============================================================ */}
        {/* TRAZA DE RAZONAMIENTO: DESPLEGABLE "Ver cómo he llegado a esto" */}
        {/* ============================================================ */}
        <section className="rounded-[22px] bg-surface p-5 md:col-span-12">
          <details className="no-print group">
            <summary className="flex cursor-pointer list-none items-center justify-between text-[16px] font-medium text-ink hover:text-accent [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-accent" aria-hidden="true" />
                <span>Ver cómo he llegado a esto</span>
              </span>
              <span className="flex items-center gap-3">
                <span className="text-[13px] font-normal text-muted group-open:hidden">
                  4 pasos de inferencia lógica
                </span>
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 text-muted" aria-hidden="true" />
              </span>
            </summary>

            <div className="mt-6 border-t border-rule pt-6 space-y-8">
              {/* Barra superior con botón Copiar Traza */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-[16px] bg-raised p-4">
                <div>
                  <h3 className="text-[14px] font-medium text-ink">
                    Traza determinista del razonamiento lógico
                  </h3>
                  <p className="text-[12px] text-muted">
                    Construida exclusivamente a partir de los hechos del usuario, la unificación en Prolog y el cálculo del perfil.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopiarTraza}
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-control bg-surface px-4 text-[13px] font-medium text-ink transition-colors hover:border-ink hover:bg-raised active:scale-95"
                >
                  {copiadoTraza ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                      <span>¡Copiada al portapapeles!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Copiar traza</span>
                    </>
                  )}
                </button>
              </div>

              {/* PASO 1 - Tus datos */}
              <div className="rounded-[18px] border border-line bg-raised p-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[12px] font-bold text-white">
                    1
                  </span>
                  <h4 className="text-[15px] font-medium text-ink">Paso 1 – Tus datos</h4>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-[13px]">
                  <div className="rounded-[10px] bg-surface p-3">
                    <span className="text-muted block text-[11px] uppercase tracking-wide">Curso escolar</span>
                    <span className="font-medium text-ink">{traza.paso1.cursoTexto}</span>
                  </div>
                  <div className="rounded-[10px] bg-surface p-3">
                    <span className="text-muted block text-[11px] uppercase tracking-wide">Modalidad</span>
                    <span className="font-medium text-ink">{traza.paso1.modalidadTexto}</span>
                  </div>
                  <div className="rounded-[10px] bg-surface p-3">
                    <span className="text-muted block text-[11px] uppercase tracking-wide">Materias matriculadas</span>
                    <span className="font-medium text-ink">{traza.paso1.materiasTexto}</span>
                  </div>
                  <div className="rounded-[10px] bg-surface p-3">
                    <span className="text-muted block text-[11px] uppercase tracking-wide">Preferencia inicial</span>
                    <span className="font-medium text-ink">{traza.paso1.preferenciaTexto}</span>
                  </div>
                  <div className="rounded-[10px] bg-surface p-3">
                    <span className="text-muted block text-[11px] uppercase tracking-wide">Universidades privadas</span>
                    <span className="font-medium text-ink">{traza.paso1.contemplaPrivadaTexto}</span>
                  </div>
                  <div className="rounded-[10px] bg-surface p-3">
                    <span className="text-muted block text-[11px] uppercase tracking-wide">Nota media aproximada</span>
                    <span className="font-medium text-ink">{traza.paso1.notaMediaTexto}</span>
                  </div>
                </div>

                <div className="mt-5">
                  <h5 className="text-[13px] font-medium text-ink mb-2">
                    Respuestas al cuestionario vocacional ({traza.paso1.respuestas.length} preguntas):
                  </h5>
                  <div className="overflow-x-auto rounded-[12px] border border-line bg-surface">
                    <table className="w-full text-left text-[12px]">
                      <thead className="border-b border-rule bg-raised text-muted">
                        <tr>
                          <th className="py-2.5 px-3 font-medium">Ítem</th>
                          <th className="py-2.5 px-2 font-medium">Letra</th>
                          <th className="py-2.5 px-3 font-medium">Gusto (1-5)</th>
                          <th className="py-2.5 px-3 font-medium">Importancia (1-5)</th>
                          <th className="py-2.5 px-3 font-medium">Actividad evaluada</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rule text-ink">
                        {traza.paso1.respuestas.map((r) => (
                          <tr key={r.id} className={r.esRechazo ? 'bg-warning-soft/30' : undefined}>
                            <td className="py-2 px-3 font-mono font-medium">
                              #{r.id.toString().padStart(2, '0')}
                              {r.esAñadida && (
                                <span className="ml-1.5 rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-accent">
                                  añadida
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-2 font-mono font-bold text-accent">{r.letra}</td>
                            <td className="py-2 px-3 num">{r.gusto} / 5</td>
                            <td className="py-2 px-3 num">{r.importancia} / 5</td>
                            <td className="py-2 px-3 text-muted">
                              <span className="text-ink">{r.texto}</span>
                              {r.esRechazo && (
                                <span className="ml-2 rounded-full bg-negative-soft px-2 py-0.5 text-[10px] text-negative font-medium">
                                  Rechazo (gusto ≤ 2 e importancia ≥ 4)
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* PASO 2 - Hechos en Prolog */}
              <div className="rounded-[18px] border border-line bg-raised p-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[12px] font-bold text-white">
                    2
                  </span>
                  <h4 className="text-[15px] font-medium text-ink">Paso 2 – Hechos en Prolog</h4>
                </div>
                <p className="mt-1 text-[13px] text-muted">
                  Lista literal de los hechos asertados en la base de conocimiento dinámica de Tau-Prolog, cada uno con su origen y deducción de datos:
                </p>

                <div className="mt-4 space-y-2">
                  {traza.paso2.hechos.map((h, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-baseline gap-2 rounded-[10px] bg-surface p-3 font-mono text-[12px]"
                    >
                      <span className="font-bold text-ink shrink-0 select-all">{h.hecho}</span>
                      <span className="text-muted sm:before:content-['←_'] sm:before:text-line text-[11px] font-sans">
                        {h.origen}
                        {h.esAñadida && (
                          <span className="ml-1.5 rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-accent font-sans">
                            incluye pregunta añadida
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* PASO 3 - Reglas disparadas */}
              <div className="rounded-[18px] border border-line bg-raised p-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[12px] font-bold text-white">
                    3
                  </span>
                  <h4 className="text-[15px] font-medium text-ink">Paso 3 – Reglas disparadas</h4>
                </div>
                <p className="mt-1 text-[13px] text-muted">
                  Solo aparecen las reglas normativas y vocacionales que se han disparado efectivamente con tus datos, con la condición exacta que se cumplió:
                </p>

                <div className="mt-4 space-y-3">
                  {traza.paso3.reglas.map((r) => (
                    <div key={r.id} className="rounded-[12px] bg-surface p-4 border-l-4 border-accent">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium text-ink text-[14px]">{r.conclusion}</span>
                        <span className="font-mono text-[11px] text-muted bg-raised px-2 py-0.5 rounded">
                          {r.id}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[13px] text-muted leading-relaxed">
                        <strong className="text-ink font-medium">Condición cumplida:</strong> {r.condicion}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* PASO 4 - Cálculo de cada opción mostrada */}
              <div className="rounded-[18px] border border-line bg-raised p-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[12px] font-bold text-white">
                    4
                  </span>
                  <h4 className="text-[15px] font-medium text-ink">Paso 4 – Cálculo de cada opción mostrada</h4>
                </div>
                <p className="mt-1 text-[13px] text-muted">
                  Letras de la titulación, puntuación del estudiante en cada letra, media aritmética, penalización por rechazos y puntuación final:
                </p>

                <div className="mt-4 space-y-2.5">
                  {traza.paso4.calculos.map((c, idx) => (
                    <div
                      key={idx}
                      className="rounded-[12px] bg-surface p-3.5 border border-line flex flex-col gap-1 font-mono text-[12px]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-sans font-medium text-ink text-[14px]">
                          {idx + 1}. {c.nombre}{' '}
                          <span className="text-[11px] font-normal text-muted">
                            ({c.tipo === 'uni' ? 'Universidad' : 'Grado Superior FP'})
                          </span>
                        </span>
                        <span className="font-bold text-ink text-[14px]">{fmtPuntos(c.puntuacionFinal)}</span>
                      </div>
                      <div className="text-muted select-all">
                        {c.lineaResumen}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-[12px] bg-surface p-3.5 text-[13px] text-muted border border-rule">
                  <strong className="text-ink font-medium">Criterio de ordenación final:</strong>{' '}
                  {traza.paso4.explicacionOrden}
                </div>
              </div>
            </div>
          </details>
        </section>
      </div>

      <div className="no-print mt-10 flex justify-center">
        <button
          type="button"
          onClick={onReiniciar}
          className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-muted transition-colors hover:bg-surface hover:text-ink"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Empezar de nuevo
        </button>
      </div>
    </div>
  );
};
