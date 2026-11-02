import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react';
import { ITEMS_CUESTIONARIO, RespuestaItem, RespuestasCuestionario } from '../perfil';
import { NOMBRES_LETRAS_RIASEC } from '../reglas';
import { ItemCuestionarioCompleto } from '../preguntasExpert';

type TipoEjemplo = 'tecnologico' | 'social_salud' | 'empresa_gestion' | 'artistico' | 'plano';

interface PantallaCuestionarioProps {
  respuestas: RespuestasCuestionario;
  onActualizarRespuesta: (itemId: number, campo: 'gusto' | 'importancia', valor: number) => void;
  onCargarEjemplo: (tipo: TipoEjemplo) => void;
  onVolver: () => void;
  onProcesar: () => void;
  items?: ItemCuestionarioCompleto[];
}

/** Pausa antes de pasar a la siguiente pregunta, para que se vea la respuesta marcada. */
const PAUSA_AVANCE_MS = 380;
/** Pausa más larga si la respuesta activa un rechazo, para que dé tiempo a leer el aviso. */
const PAUSA_AVANCE_RECHAZO_MS = 1600;

const EJEMPLOS: Array<{ tipo: TipoEjemplo; nombre: string }> = [
  { tipo: 'tecnologico', nombre: 'Ingeniería y tecnología' },
  { tipo: 'social_salud', nombre: 'Sanidad y social' },
  { tipo: 'empresa_gestion', nombre: 'Administración y gestión' },
  { tipo: 'artistico', nombre: 'Artístico' },
  { tipo: 'plano', nombre: 'Intereses repartidos' },
];

const PALABRAS_GUSTO = ['Nada', 'Poco', 'Algo', 'Bastante', 'Mucho'];
const PALABRAS_IMPORTANCIA = ['Nada', 'Poco', 'Algo', 'Bastante', 'Fundamental'];

const estaCompleta = (r?: RespuestaItem) => r?.gusto !== undefined && r?.importancia !== undefined;
const esRechazo = (r?: RespuestaItem) =>
  r?.gusto !== undefined && r?.importancia !== undefined && r.gusto <= 2 && r.importancia >= 4;

/** Siguiente pregunta sin responder después de `desde`, dando la vuelta; si no queda ninguna, el cierre. */
function siguientePendiente(
  itemsLista: ItemCuestionarioCompleto[],
  respuestas: RespuestasCuestionario,
  desde: number
): number {
  const total = itemsLista.length;
  for (let paso = 1; paso <= total; paso++) {
    const i = (desde + paso) % total;
    if (!estaCompleta(respuestas[itemsLista[i].id])) return i;
  }
  return total;
}

const Escala: React.FC<{
  id: string;
  pregunta: string;
  palabras: string[];
  valor?: number;
  onElegir: (valor: number) => void;
}> = ({ id, pregunta, palabras, valor, onElegir }) => (
  <div role="radiogroup" aria-labelledby={id}>
    <div className="flex items-baseline justify-between gap-4">
      <p id={id} className="text-[15px] font-medium text-ink">
        {pregunta}
      </p>
      <span className="hidden shrink-0 text-[13px] text-muted sm:inline">{valor ? palabras[valor - 1] : 'Sin responder'}</span>
    </div>
    <div className="mt-3 grid grid-cols-5 gap-1 rounded-full border border-line bg-raised p-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const elegido = valor === n;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={elegido}
            aria-label={`${n}: ${palabras[n - 1]}`}
            onClick={() => onElegir(n)}
            className={`num h-12 rounded-full text-[16px] transition-[background-color,color,transform] duration-150 active:scale-95 ${
              elegido ? 'bg-ink text-white' : 'text-ink hover:bg-active'
            }`}
          >
            {n}
          </button>
        );
      })}
    </div>
    <div className="mt-2 flex justify-between px-3 text-[12px] text-muted" aria-hidden="true">
      <span>{palabras[0]}</span>
      <span>{palabras[4]}</span>
    </div>
  </div>
);

export const PantallaCuestionario: React.FC<PantallaCuestionarioProps> = ({
  respuestas,
  onActualizarRespuesta,
  onCargarEjemplo,
  onVolver,
  onProcesar,
  items,
}) => {
  const itemsLista: ItemCuestionarioCompleto[] =
    items && items.length > 0
      ? items
      : ITEMS_CUESTIONARIO.map((it) => ({ ...it, origen: 'base' as const }));

  const TOTAL = itemsLista.length;
  const CIERRE = TOTAL;

  const reducirMovimiento = useReducedMotion();
  const [indice, setIndice] = useState<number>(() => {
    const primera = itemsLista.findIndex((it) => !estaCompleta(respuestas[it.id]));
    return primera === -1 ? CIERRE : primera;
  });
  const [direccion, setDireccion] = useState<1 | -1>(1);
  const temporizador = useRef<number | null>(null);
  const respuestasRef = useRef(respuestas);
  respuestasRef.current = respuestas;

  const completadas = itemsLista.filter((it) => estaCompleta(respuestas[it.id])).length;
  const pendientes = itemsLista.filter((it) => !estaCompleta(respuestas[it.id]));
  const todoRespondido = pendientes.length === 0;

  const cancelarAvance = () => {
    if (temporizador.current !== null) {
      window.clearTimeout(temporizador.current);
      temporizador.current = null;
    }
  };

  useEffect(() => cancelarAvance, []);

  const irA = useCallback(
    (destino: number) => {
      cancelarAvance();
      const acotado = Math.max(0, Math.min(CIERRE, destino));
      setIndice((actual) => {
        setDireccion(acotado >= actual ? 1 : -1);
        return acotado;
      });
    },
    [CIERRE]
  );

  const item = indice < TOTAL ? itemsLista[indice] : null;
  const resp = item ? respuestas[item.id] || {} : {};

  const elegir = useCallback(
    (campo: 'gusto' | 'importancia', valor: number) => {
      if (!item) return;
      cancelarAvance();
      onActualizarRespuesta(item.id, campo, valor);

      const nueva: RespuestaItem = { ...(respuestasRef.current[item.id] || {}), [campo]: valor };
      if (!estaCompleta(nueva)) return;

      const desde = indice;
      temporizador.current = window.setTimeout(
        () => {
          temporizador.current = null;
          const conEsta = { ...respuestasRef.current, [item.id]: nueva };
          irA(siguientePendiente(itemsLista, conEsta, desde));
        },
        esRechazo(nueva) ? PAUSA_AVANCE_RECHAZO_MS : PAUSA_AVANCE_MS
      );
    },
    [item, indice, irA, onActualizarRespuesta, itemsLista]
  );

  // Teclado: 1-5 responde la escala pendiente; las flechas mueven entre preguntas.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const destino = e.target as HTMLElement | null;
      if (destino && ['INPUT', 'TEXTAREA', 'SELECT'].includes(destino.tagName)) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        irA(indice - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        irA(indice + 1);
      } else if (item && /^[1-5]$/.test(e.key)) {
        const n = Number(e.key);
        const actual = respuestasRef.current[item.id] || {};
        if (actual.gusto === undefined) elegir('gusto', n);
        else if (actual.importancia === undefined) elegir('importancia', n);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [indice, item, elegir, irA]);

  const cargarEjemplo = (tipo: TipoEjemplo, details: HTMLDetailsElement | null) => {
    onCargarEjemplo(tipo);
    if (details) details.open = false;
    irA(CIERRE);
  };

  const desplazamiento = reducirMovimiento ? 0 : 28;
  const variantes = {
    entra: (d: number) => ({ opacity: 0, x: d * desplazamiento }),
    quieta: { opacity: 1, x: 0 },
    sale: (d: number) => ({ opacity: 0, x: d * -desplazamiento }),
  };

  return (
    <div className="mx-auto max-w-[760px]">
      {/* Progreso: una marca por pregunta; se puede saltar a cualquiera */}
      <div className="flex items-center justify-between gap-4">
        <p className="num text-muted" aria-live="polite">
          {item ? (
            <>
              Pregunta <span className="text-ink">{indice + 1}</span> de {TOTAL}
            </>
          ) : (
            <>
              {completadas} de {TOTAL} respondidas
            </>
          )}
        </p>

        <details className="no-print group relative">
          <summary className="flex cursor-pointer list-none items-center gap-1 text-[13px] text-muted hover:text-ink [&::-webkit-details-marker]:hidden">
            Probar con un ejemplo
            <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="absolute right-0 z-20 mt-2 w-60 rounded-[14px] border border-line bg-raised p-1.5 flota">
            <p className="px-3 pb-1 pt-2 text-[12px] text-muted">Rellena las respuestas con un perfil tipo</p>
            {EJEMPLOS.map((ej) => (
              <button
                key={ej.tipo}
                type="button"
                onClick={(e) => cargarEjemplo(ej.tipo, (e.currentTarget.closest('details') as HTMLDetailsElement) || null)}
                className="block w-full rounded-[10px] px-3 py-2 text-left text-ink hover:bg-surface"
              >
                {ej.nombre}
              </button>
            ))}
          </div>
        </details>
      </div>

      <ol className="mt-3 flex gap-1 overflow-x-auto py-1" aria-label="Preguntas">
        {itemsLista.map((it, i) => {
          const hecha = estaCompleta(respuestas[it.id]);
          const actual = i === indice;
          return (
            <li key={it.id} className="flex-1 min-w-[12px]">
              <button
                type="button"
                onClick={() => irA(i)}
                aria-label={`Pregunta ${i + 1}${it.origen === 'añadida' ? ' (añadida)' : ''}${hecha ? ', respondida' : ', sin responder'}`}
                aria-current={actual ? 'step' : undefined}
                className="group block w-full py-2"
              >
                <span
                  className={`block h-1.5 rounded-full transition-colors ${
                    actual ? 'bg-accent' : hecha ? 'bg-ink' : 'bg-line group-hover:bg-control'
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ol>

      {/* La tarjeta de la pregunta (o el cierre) */}
      <div className="relative mt-6 overflow-hidden">
        <AnimatePresence mode="wait" custom={direccion} initial={false}>
          <motion.div
            key={indice}
            custom={direccion}
            variants={variantes}
            initial="entra"
            animate="quieta"
            exit="sale"
            transition={{ duration: reducirMovimiento ? 0.12 : 0.22, ease: [0.2, 0, 0, 1] }}
          >
            {item ? (
              <div className="rounded-[22px] bg-surface p-5 sm:p-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[13px] text-muted">
                    Área {NOMBRES_LETRAS_RIASEC[item.letra]?.nombre.replace(/ \(.\)$/, '').toLowerCase()}
                  </span>
                  {item.origen === 'añadida' && (
                    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">
                      Añadida por experto
                    </span>
                  )}
                </div>
                <h1 className="font-serif text-[30px] leading-[1.1] tracking-[-0.01em] text-ink sm:text-[44px]">
                  {item.texto}
                </h1>

                <div className="mt-8 space-y-7">
                  <Escala
                    id={`gusto-${item.id}`}
                    pregunta="¿Cuánto te gusta?"
                    palabras={PALABRAS_GUSTO}
                    valor={resp.gusto}
                    onElegir={(v) => elegir('gusto', v)}
                  />
                  <Escala
                    id={`importancia-${item.id}`}
                    pregunta="¿Cuánto te importa que forme parte de tus estudios o tu trabajo?"
                    palabras={PALABRAS_IMPORTANCIA}
                    valor={resp.importancia}
                    onElegir={(v) => elegir('importancia', v)}
                  />
                </div>

                <AnimatePresence initial={false}>
                  {esRechazo(resp) && (
                    <motion.p
                      role="status"
                      initial={{ opacity: 0, y: reducirMovimiento ? 0 : 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="mt-6 rounded-[12px] border border-warning-line bg-warning-soft px-4 py-3 text-[13px] leading-[18px] text-warning"
                    >
                      No te gusta y te importa mucho: restaremos 1 punto a las opciones de esta área.
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="rounded-[22px] bg-surface p-5 sm:p-10">
                <h1 className="font-serif text-[30px] leading-[1.1] tracking-[-0.01em] text-ink sm:text-[44px]">
                  {todoRespondido ? `Ya está, las ${TOTAL} respondidas` : `Te faltan ${pendientes.length} por responder`}
                </h1>
                <p className="mt-3 text-[15px] leading-[22px] text-muted">
                  {todoRespondido
                    ? 'Repasa lo que quieras tocando una pregunta. Cuando lo tengas, calculamos tu perfil y tus seis mejores opciones.'
                    : 'Necesitamos todas para que el resultado sea fiable. Toca una para responderla.'}
                </p>

                <ul className="mt-6 grid gap-x-6 sm:grid-cols-2">
                  {itemsLista.map((it, i) => {
                    const r = respuestas[it.id];
                    const hecha = estaCompleta(r);
                    return (
                      <li key={it.id} className="border-b border-rule">
                        <button
                          type="button"
                          onClick={() => irA(i)}
                          className="flex min-h-11 w-full items-center justify-between gap-3 py-2 text-left hover:text-accent"
                        >
                          <span className="truncate text-[13px] text-ink">
                            {it.texto}
                            {it.origen === 'añadida' && <span className="text-muted ml-1 text-[11px]">(añadida)</span>}
                          </span>
                          {hecha ? (
                            <span className="num shrink-0 text-[13px] text-muted" title="Gusto · importancia">
                              {r!.gusto} · {r!.importancia}
                            </span>
                          ) : (
                            <span className="shrink-0 text-[13px] text-negative">Falta</span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-3 text-[12px] text-muted">Cifras: gusto · importancia, de 1 a 5.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navegación */}
      <div className="no-print mt-6 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => (indice === 0 ? onVolver() : irA(indice - 1))}
          className="inline-flex h-11 items-center gap-2 rounded-full px-3 text-muted transition-colors hover:bg-surface hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {indice === 0 ? 'Tus datos' : 'Anterior'}
        </button>

        <p className="hidden text-[12px] text-muted md:block">Teclas 1 a 5 para responder, flechas para moverte</p>

        {todoRespondido ? (
          <button
            type="button"
            onClick={onProcesar}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-6 font-medium text-white transition-colors hover:bg-black active:scale-[0.98]"
          >
            Ver mi resultado
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : indice === CIERRE ? (
          <button
            type="button"
            onClick={() => irA(siguientePendiente(itemsLista, respuestas, -1))}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-6 font-medium text-white transition-colors hover:bg-black active:scale-[0.98]"
          >
            Responder las que faltan
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => irA(indice + 1)}
            className="inline-flex h-11 items-center gap-2 rounded-full px-3 text-muted transition-colors hover:bg-surface hover:text-ink"
          >
            {estaCompleta(resp) ? 'Siguiente' : 'Saltar'}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};
