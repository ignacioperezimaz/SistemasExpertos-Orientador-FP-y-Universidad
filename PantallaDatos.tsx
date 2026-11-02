import React, { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { DatosUsuario } from '../motor';
import { LISTA_MATERIAS } from '../types';

interface PantallaDatosProps {
  datos: DatosUsuario;
  onGuardarDatos: (datos: DatosUsuario) => void;
  onContinuar: () => void;
}

type Modalidad = DatosUsuario['modalidad'];
type Preferencia = DatosUsuario['preferencia'];

const MODALIDADES: Array<{ id: Modalidad; nombre: string; desc: string }> = [
  { id: 'ciencias_tecnologia', nombre: 'Ciencias y Tecnología', desc: 'Ingenierías, Arquitectura, Ciencias y Salud.' },
  { id: 'humanidades_ccss', nombre: 'Humanidades y CCSS', desc: 'Ciencias Sociales, Jurídicas, Letras y Educación.' },
  { id: 'artes', nombre: 'Artes', desc: 'Artes plásticas, imagen, diseño y audiovisual.' },
  { id: 'general', nombre: 'General', desc: 'Itinerario interdisciplinar y flexible.' },
];

const PREFERENCIAS: Array<{ id: Preferencia; nombre: string; desc: string }> = [
  { id: 'sin_decidir', nombre: 'Sin decidir', desc: 'Abierto a las dos vías.' },
  { id: 'fp', nombre: 'Me tira más la FP', desc: 'Grado Superior primero.' },
  { id: 'uni', nombre: 'Me tira más la universidad', desc: 'Grado universitario.' },
];

/** Una opción de elección única dentro de un panel. */
const Opcion: React.FC<{
  seleccionada: boolean;
  onElegir: () => void;
  titulo: string;
  desc?: string;
}> = ({ seleccionada, onElegir, titulo, desc }) => (
  <button
    type="button"
    role="radio"
    aria-checked={seleccionada}
    onClick={onElegir}
    className={`flex min-h-11 w-full items-start justify-between gap-3 rounded-[12px] border bg-raised px-4 py-3 text-left transition-colors ${
      seleccionada ? 'border-ink' : 'border-line hover:border-control'
    }`}
  >
    <span>
      <span className="block font-medium text-ink">{titulo}</span>
      {desc && <span className="mt-0.5 block text-[13px] leading-[18px] text-muted">{desc}</span>}
    </span>
    <span
      aria-hidden="true"
      className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border ${
        seleccionada ? 'border-ink bg-ink text-white' : 'border-control'
      }`}
    >
      {seleccionada && <Check className="h-3 w-3" strokeWidth={3} />}
    </span>
  </button>
);

/** Una fila de ajustes: etiqueta y descripción a la izquierda, panel a la derecha. */
const Seccion: React.FC<{
  id?: string;
  titulo: string;
  desc: React.ReactNode;
  extra?: React.ReactNode;
  children: React.ReactNode;
}> = ({ id, titulo, desc, extra, children }) => (
  <section id={id} className="grid scroll-mt-8 gap-4 border-t border-line py-8 md:grid-cols-12">
    <div className="md:col-span-4 md:pr-6">
      <h2 className="text-[16px] font-medium leading-6 text-ink">{titulo}</h2>
      <div className="mt-1 text-muted">{desc}</div>
      {extra}
    </div>
    <div className="rounded-[16px] bg-surface p-4 md:col-span-8">{children}</div>
  </section>
);

export const PantallaDatos: React.FC<PantallaDatosProps> = ({ datos, onGuardarDatos, onContinuar }) => {
  const [curso, setCurso] = useState<1 | 2>(datos.curso);
  const [modalidad, setModalidad] = useState<Modalidad>(datos.modalidad);
  const [materias, setMaterias] = useState<string[]>(datos.materias);
  const [contemplaPrivada, setContemplaPrivada] = useState<boolean>(datos.contemplaPrivada);
  const [preferencia, setPreferencia] = useState<Preferencia>(datos.preferencia);
  const [notaMedia, setNotaMedia] = useState<string>(
    datos.notaMedia !== undefined && datos.notaMedia !== null ? String(datos.notaMedia) : ''
  );
  const [errorMaterias, setErrorMaterias] = useState(false);

  const materiasAfines = LISTA_MATERIAS.filter((m) => m.modalidadesComunes.includes(modalidad));
  const materiasOtras = LISTA_MATERIAS.filter((m) => !m.modalidadesComunes.includes(modalidad));

  const toggleMateria = (id: string) => {
    setMaterias((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
    setErrorMaterias(false);
  };

  const sugerirMaterias = () => {
    setMaterias(Array.from(new Set([...materias, ...materiasAfines.map((m) => m.id)])));
    setErrorMaterias(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (materias.length === 0) {
      setErrorMaterias(true);
      document.getElementById('seccion-materias')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    const notaNum = notaMedia.trim() !== '' ? parseFloat(notaMedia.replace(',', '.')) : null;

    onGuardarDatos({
      curso,
      modalidad,
      materias,
      contemplaPrivada,
      preferencia,
      notaMedia: notaNum === null || isNaN(notaNum) ? null : notaNum,
    });
    onContinuar();
  };

  const chipMateria = (m: (typeof LISTA_MATERIAS)[number]) => {
    const elegida = materias.includes(m.id);
    return (
      <button
        key={m.id}
        type="button"
        aria-pressed={elegida}
        onClick={() => toggleMateria(m.id)}
        className={`inline-flex h-9 flex-none items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] transition-colors ${
          elegida
            ? 'border-ink bg-ink text-white'
            : 'border-control bg-raised text-ink hover:border-ink'
        }`}
      >
        {elegida && <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />}
        {m.nombre}
      </button>
    );
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="max-w-[760px] pb-10">
        <h1 className="font-serif text-[36px] leading-[1.05] tracking-[-0.01em] text-ink sm:text-[48px]">
          Cuéntanos qué estudias
        </h1>
        <p className="mt-4 text-[16px] leading-6 text-muted">
          Con tu curso, tu modalidad y tus materias comprobamos qué te pondera para la universidad y qué
          te abre la FP de Grado Superior. Después vienen 18 preguntas cortas.
        </p>
      </div>

      <Seccion titulo="Curso" desc="El que estás haciendo ahora.">
        <div role="radiogroup" aria-label="Curso" className="grid gap-2 sm:grid-cols-2">
          <Opcion
            seleccionada={curso === 1}
            onElegir={() => setCurso(1)}
            titulo="1.º de Bachillerato"
            desc="Aún puedes elegir en 2.º materias que ponderen 0,2."
          />
          <Opcion
            seleccionada={curso === 2}
            onElegir={() => setCurso(2)}
            titulo="2.º de Bachillerato"
            desc="Toca decidir entre la PAU y las pasarelas desde FP."
          />
        </div>
      </Seccion>

      <Seccion titulo="Modalidad" desc="Decide qué accesos son preferentes.">
        <div role="radiogroup" aria-label="Modalidad" className="grid gap-2 sm:grid-cols-2">
          {MODALIDADES.map((m) => (
            <Opcion
              key={m.id}
              seleccionada={modalidad === m.id}
              onElegir={() => setModalidad(m.id)}
              titulo={m.nombre}
              desc={m.desc}
            />
          ))}
        </div>
      </Seccion>

      <Seccion
        id="seccion-materias"
        titulo="Materias de 2.º"
        desc="Las que cursas o piensas cursar. Sirven para ver qué pondera en la PAU."
        extra={
          <div className="mt-4 space-y-3">
            <p className="num text-ink">
              {materias.length} de {LISTA_MATERIAS.length} elegidas
            </p>
            {errorMaterias && (
              <p role="alert" className="text-negative">
                Elige al menos una materia para poder calcular las ponderaciones.
              </p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <button type="button" onClick={sugerirMaterias} className="font-medium text-ink underline-offset-4 hover:underline">
                Marcar las de mi modalidad
              </button>
              {materias.length > 0 && (
                <button type="button" onClick={() => setMaterias([])} className="text-muted underline-offset-4 hover:text-ink hover:underline">
                  Quitar todas
                </button>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          <div>
            <h3 className="mb-2.5 text-[13px] text-muted">Habituales en tu modalidad</h3>
            <div className="flex flex-wrap gap-2">{materiasAfines.map(chipMateria)}</div>
          </div>
          <div>
            <h3 className="mb-2.5 text-[13px] text-muted">Otras materias</h3>
            <div className="flex flex-wrap gap-2">{materiasOtras.map(chipMateria)}</div>
          </div>
        </div>
      </Seccion>

      <Seccion titulo="Lo que te tira ahora" desc="Solo desempata opciones casi iguales (0,3 puntos o menos). No descarta nada.">
        <div role="radiogroup" aria-label="Preferencia inicial" className="grid gap-2 sm:grid-cols-3">
          {PREFERENCIAS.map((p) => (
            <Opcion
              key={p.id}
              seleccionada={preferencia === p.id}
              onElegir={() => setPreferencia(p.id)}
              titulo={p.nombre}
              desc={p.desc}
            />
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Universidades privadas" desc="En Euskadi son Deusto y Mondragon Unibertsitatea. La pública es la UPV/EHU.">
        <div role="radiogroup" aria-label="Universidades privadas" className="grid gap-2 sm:grid-cols-2">
          <Opcion
            seleccionada={contemplaPrivada}
            onElegir={() => setContemplaPrivada(true)}
            titulo="Las tengo en cuenta"
            desc="Pública y privadas."
          />
          <Opcion
            seleccionada={!contemplaPrivada}
            onElegir={() => setContemplaPrivada(false)}
            titulo="Solo la pública"
            desc="Solo UPV/EHU."
          />
        </div>
      </Seccion>

      <Seccion titulo="Nota media" desc="Opcional. Es informativa: no se usa para descartar opciones.">
        <label htmlFor="nota-media" className="block font-medium text-ink">
          Tu media aproximada, de 0 a 10
        </label>
        <input
          id="nota-media"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          max="10"
          placeholder="Por ejemplo, 7,65"
          value={notaMedia}
          onChange={(e) => setNotaMedia(e.target.value)}
          className="num mt-2 h-10 w-full max-w-[220px] rounded-[10px] border border-line bg-raised px-3 text-ink placeholder:text-muted focus:border-ink focus:outline-none"
        />
      </Seccion>

      <div className="flex flex-col-reverse gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted">18 preguntas, una cada vez. Unos cuatro minutos.</p>
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-6 font-medium text-white transition-colors hover:bg-black active:scale-[0.98]"
        >
          Empezar el cuestionario
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
};
