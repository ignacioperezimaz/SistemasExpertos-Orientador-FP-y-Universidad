import React from 'react';
import { Shield } from 'lucide-react';

interface FooterProps {
  totalAñadidas?: number;
  onAbrirExperto?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ totalAñadidas = 0, onAbrirExperto }) => {
  return (
    <footer className="mt-24 border-t border-rule">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-4 px-4 py-8 text-[12px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-0">
        <div className="space-y-1">
          <p>
            Orientativo, con datos del curso 2026-2027. No sustituye a la orientadora o el orientador de tu centro.
          </p>
          <p>Todo se calcula en tu navegador: no guardamos tus respuestas.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-muted">
          <span className="rounded-full bg-surface px-3 py-1 font-mono text-[11px] text-ink">
            Base de conocimiento: 18 preguntas base + {totalAñadidas} {totalAñadidas === 1 ? 'añadida' : 'añadidas'}
          </span>

          {onAbrirExperto && (
            <button
              type="button"
              onClick={onAbrirExperto}
              className="inline-flex items-center gap-1.5 text-muted underline-offset-4 hover:text-ink hover:underline transition-colors cursor-pointer"
            >
              <Shield className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Modo experto</span>
            </button>
          )}
        </div>
      </div>
    </footer>
  );
};
