import React from 'react';
import { Check } from 'lucide-react';
import { PasoOrientador } from '../types';

interface HeaderProps {
  pasoActual: PasoOrientador;
  onIrPaso: (paso: PasoOrientador) => void;
  pasoMaximoAlcanzado: number;
}

/** Marca del producto: un camino que se bifurca en dos (FP y universidad). */
export const MarcaOrientador: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
    <rect width="32" height="32" rx="9" fill="var(--color-accent)" />
    <path
      d="M16 26v-8M16 18l-6-7M16 18l6-7"
      stroke="#fff"
      strokeWidth="2.4"
      strokeLinecap="round"
      fill="none"
    />
    <circle cx="10" cy="9.5" r="2.2" fill="#fff" />
    <circle cx="22" cy="9.5" r="2.2" fill="#fff" />
  </svg>
);

const PASOS: Array<{ numero: PasoOrientador; titulo: string }> = [
  { numero: 1, titulo: 'Tus datos' },
  { numero: 2, titulo: 'Cuestionario' },
  { numero: 3, titulo: 'Resultado' },
];

export const Header: React.FC<HeaderProps> = ({ pasoActual, onIrPaso, pasoMaximoAlcanzado }) => {
  return (
    <header className="border-b border-rule bg-ground">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-3 px-4 py-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-0 lg:px-0">
        <div className="flex items-center gap-3">
          <MarcaOrientador className="h-8 w-8 shrink-0" />
          <div className="leading-tight">
            <div className="text-[14px] font-semibold text-ink">Orientador FP y Universidad</div>
            <div className="text-[12px] text-muted">Bachillerato en Euskadi · curso 2026-2027</div>
          </div>
        </div>

        <nav aria-label="Pasos de la orientación">
          <ol className="flex items-center gap-1">
            {PASOS.map((paso) => {
              const esActivo = pasoActual === paso.numero;
              const esCompletado = pasoMaximoAlcanzado > paso.numero && !esActivo;
              const esClicable = pasoMaximoAlcanzado >= paso.numero;

              return (
                <li key={paso.numero}>
                  <button
                    type="button"
                    onClick={() => esClicable && onIrPaso(paso.numero)}
                    disabled={!esClicable}
                    aria-current={esActivo ? 'step' : undefined}
                    className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] transition-colors ${
                      esActivo
                        ? 'bg-active font-medium text-ink'
                        : esClicable
                        ? 'text-muted hover:bg-surface hover:text-ink'
                        : 'cursor-not-allowed text-muted'
                    }`}
                  >
                    {esCompletado && <Check className="h-3.5 w-3.5" strokeWidth={2} />}
                    {paso.titulo}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </header>
  );
};
