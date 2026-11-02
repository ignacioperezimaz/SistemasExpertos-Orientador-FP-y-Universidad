import React, { useMemo, useState } from 'react';
import { Header } from './components/Header';
import { PantallaDatos } from './components/PantallaDatos';
import { PantallaCuestionario } from './components/PantallaCuestionario';
import { PantallaResultado } from './components/PantallaResultado';
import { Footer } from './components/Footer';
import { ModoExperto } from './components/ModoExperto';
import { DatosUsuario, ResultadoMotor, ejecutarMotor } from './motor';
import { calcularPerfil, RespuestasCuestionario } from './perfil';
import { PasoOrientador } from './types';
import { KeyRound, Loader2, ShieldAlert, X } from 'lucide-react';
import {
  PIN_MODO_EXPERTO,
  PreguntaAñadida,
  guardarPreguntasAñadidas,
  obtenerPreguntasActivasParaCuestionario,
  obtenerPreguntasAñadidas,
} from './preguntasExpert';

const DATOS_INICIALES: DatosUsuario = {
  curso: 2,
  modalidad: 'ciencias_tecnologia',
  materias: ['matematicas_2', 'fisica', 'quimica'],
  contemplaPrivada: true,
  preferencia: 'sin_decidir',
  notaMedia: null,
};

export default function App() {
  const [pasoActual, setPasoActual] = useState<PasoOrientador>(1);
  const [pasoMaximoAlcanzado, setPasoMaximoAlcanzado] = useState<number>(1);
  const [datosUsuario, setDatosUsuario] = useState<DatosUsuario>(DATOS_INICIALES);
  const [respuestas, setRespuestas] = useState<RespuestasCuestionario>({});
  const [resultadoMotor, setResultadoMotor] = useState<ResultadoMotor | null>(null);
  const [procesandoProlog, setProcesandoProlog] = useState<boolean>(false);

  // Estado del Modo Experto
  const [preguntasAñadidas, setPreguntasAñadidas] = useState<PreguntaAñadida[]>(() =>
    obtenerPreguntasAñadidas()
  );
  const [modoExpertoAbierto, setModoExpertoAbierto] = useState<boolean>(false);
  const [modalPinAbierto, setModalPinAbierto] = useState<boolean>(false);
  const [pinIngresado, setPinIngresado] = useState<string>('');
  const [errorPin, setErrorPin] = useState<string | null>(null);

  // Preguntas activas (18 base + añadidas activas)
  const itemsActivos = useMemo(() => {
    return obtenerPreguntasActivasParaCuestionario(preguntasAñadidas);
  }, [preguntasAñadidas]);

  const irAPaso = (paso: PasoOrientador) => {
    setPasoActual(paso);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGuardarDatos = (nuevosDatos: DatosUsuario) => {
    setDatosUsuario(nuevosDatos);
  };

  const handleActualizarRespuesta = (
    itemId: number,
    campo: 'gusto' | 'importancia',
    valor: number
  ) => {
    setRespuestas((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [campo]: valor,
      },
    }));
  };

  const handleCargarEjemplo = (
    tipo: 'tecnologico' | 'social_salud' | 'empresa_gestion' | 'artistico' | 'plano'
  ) => {
    const nuevasRespuestas: RespuestasCuestionario = {};

    for (const item of itemsActivos) {
      let gusto = 3;
      let importancia = 3;

      if (tipo === 'tecnologico') {
        if (item.letra === 'r') {
          gusto = 5;
          importancia = 5;
        } else if (item.letra === 'i') {
          gusto = 5;
          importancia = 5;
        } else if (item.letra === 'a') {
          gusto = 3;
          importancia = 2;
        } else if (item.letra === 's') {
          gusto = 2;
          importancia = 2;
        } else if (item.letra === 'e') {
          gusto = 3;
          importancia = 3;
        } else if (item.letra === 'c') {
          gusto = 1;
          importancia = 4;
        }
      } else if (tipo === 'social_salud') {
        if (item.letra === 's') {
          gusto = 5;
          importancia = 5;
        } else if (item.letra === 'i') {
          gusto = 4;
          importancia = 4;
        } else if (item.letra === 'r') {
          gusto = 1;
          importancia = 4;
        } else if (item.letra === 'a') {
          gusto = 3;
          importancia = 3;
        } else if (item.letra === 'e') {
          gusto = 3;
          importancia = 2;
        } else if (item.letra === 'c') {
          gusto = 3;
          importancia = 3;
        }
      } else if (tipo === 'empresa_gestion') {
        if (item.letra === 'c') {
          gusto = 5;
          importancia = 5;
        } else if (item.letra === 'e') {
          gusto = 5;
          importancia = 5;
        } else if (item.letra === 's') {
          gusto = 4;
          importancia = 3;
        } else if (item.letra === 'r') {
          gusto = 1;
          importancia = 4;
        } else if (item.letra === 'i') {
          gusto = 3;
          importancia = 3;
        } else if (item.letra === 'a') {
          gusto = 2;
          importancia = 2;
        }
      } else if (tipo === 'artistico') {
        if (item.letra === 'a') {
          gusto = 5;
          importancia = 5;
        } else if (item.letra === 'r') {
          gusto = 4;
          importancia = 4;
        } else if (item.letra === 'i') {
          gusto = 4;
          importancia = 3;
        } else if (item.letra === 'c') {
          gusto = 1;
          importancia = 4;
        } else if (item.letra === 'e') {
          gusto = 3;
          importancia = 2;
        } else if (item.letra === 's') {
          gusto = 3;
          importancia = 3;
        }
      } else if (tipo === 'plano') {
        gusto = 4;
        importancia = 4;
      }

      nuevasRespuestas[item.id] = { gusto, importancia };
    }

    setRespuestas(nuevasRespuestas);
  };

  const handleProcesarOrientacion = async () => {
    setProcesandoProlog(true);

    try {
      // 1. Calcular perfil RIASEC en TypeScript con todas las preguntas activas
      const perfilCalculado = calcularPerfil(respuestas, itemsActivos);

      // 2. Ejecutar inferencia en Prolog con Tau-Prolog en el navegador
      const resultado = await ejecutarMotor(datosUsuario, perfilCalculado);

      setResultadoMotor(resultado);
      setPasoMaximoAlcanzado(3);
      setPasoActual(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error al ejecutar el motor Prolog:', err);
      alert('Se produjo un problema al ejecutar las consultas en Prolog. Por favor, revisa tus respuestas.');
    } finally {
      setProcesandoProlog(false);
    }
  };

  const handleReiniciar = () => {
    setDatosUsuario(DATOS_INICIALES);
    setRespuestas({});
    setResultadoMotor(null);
    setPasoMaximoAlcanzado(1);
    setPasoActual(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVerificarPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinIngresado.trim() === PIN_MODO_EXPERTO) {
      setModalPinAbierto(false);
      setModoExpertoAbierto(true);
      setErrorPin(null);
      setPinIngresado('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setErrorPin('PIN incorrecto. El PIN por defecto es 2026.');
    }
  };

  const handleActualizarPreguntasDesdeExperto = (nuevas: PreguntaAñadida[]) => {
    setPreguntasAñadidas(nuevas);
    guardarPreguntasAñadidas(nuevas);
  };

  // Si el modo experto está abierto, mostramos su pantalla completa
  if (modoExpertoAbierto) {
    return (
      <div className="flex min-h-screen flex-col bg-ground font-sans text-ink">
        <Header
          pasoActual={pasoActual}
          onIrPaso={irAPaso}
          pasoMaximoAlcanzado={pasoMaximoAlcanzado}
        />
        <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 pt-6 sm:px-6 sm:pt-8 lg:px-0">
          <ModoExperto
            preguntasAñadidas={preguntasAñadidas}
            onActualizarPreguntas={handleActualizarPreguntasDesdeExperto}
            onVolver={() => {
              setModoExpertoAbierto(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </main>
        <Footer
          totalAñadidas={preguntasAñadidas.filter((p) => p.activa).length}
          onAbrirExperto={() => setModoExpertoAbierto(true)}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-ground font-sans text-ink">
      <Header
        pasoActual={pasoActual}
        onIrPaso={irAPaso}
        pasoMaximoAlcanzado={pasoMaximoAlcanzado}
      />

      <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 pt-8 sm:px-6 sm:pt-12 lg:px-0">
        {/* Aviso mientras Prolog razona */}
        {procesandoProlog && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-procesando"
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4"
          >
            <div className="w-full max-w-sm rounded-[22px] bg-raised p-6 flota">
              <Loader2 className="h-5 w-5 animate-spin text-accent" aria-hidden="true" />
              <h2 id="titulo-procesando" className="mt-4 text-[16px] font-medium">
                Calculando tu orientación
              </h2>
              <p className="mt-1 text-muted">
                El motor lógico cruza tu perfil con las materias que ponderan, los accesos y las pasarelas entre FP y universidad.
              </p>
            </div>
          </div>
        )}

        {pasoActual === 1 && (
          <PantallaDatos
            datos={datosUsuario}
            onGuardarDatos={handleGuardarDatos}
            onContinuar={() => {
              setPasoMaximoAlcanzado(Math.max(pasoMaximoAlcanzado, 2));
              irAPaso(2);
            }}
          />
        )}

        {pasoActual === 2 && (
          <PantallaCuestionario
            respuestas={respuestas}
            onActualizarRespuesta={handleActualizarRespuesta}
            onCargarEjemplo={handleCargarEjemplo}
            onVolver={() => irAPaso(1)}
            onProcesar={handleProcesarOrientacion}
            items={itemsActivos}
          />
        )}

        {pasoActual === 3 && resultadoMotor && (
          <PantallaResultado
            resultado={resultadoMotor}
            onReiniciar={handleReiniciar}
            onModificarRespuestas={() => irAPaso(2)}
            respuestas={respuestas}
            items={itemsActivos}
          />
        )}
      </main>

      <Footer
        totalAñadidas={preguntasAñadidas.filter((p) => p.activa).length}
        onAbrirExperto={() => {
          setPinIngresado('');
          setErrorPin(null);
          setModalPinAbierto(true);
        }}
      />

      {/* Modal de autenticación básica con PIN para Modo Experto */}
      {modalPinAbierto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-pin-experto"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-[24px] border border-line bg-surface p-6 shadow-xl sm:p-7">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <KeyRound className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 id="titulo-pin-experto" className="text-[17px] font-medium text-ink">
                    Acceso al Modo Experto
                  </h3>
                  <p className="text-[12px] text-muted">Gestión de la base de conocimiento y preguntas</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalPinAbierto(false)}
                className="rounded-full p-1.5 text-muted hover:bg-raised hover:text-ink transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 rounded-[12px] border border-line bg-raised p-3 text-[12px] text-muted flex items-start gap-2.5">
              <ShieldAlert className="h-4 w-4 text-accent shrink-0 mt-0.5" aria-hidden="true" />
              <p>
                Esta es una <strong>protección básica de interfaz</strong> (PIN: 2026) para evitar modificaciones accidentales por parte de estudiantes, no una seguridad criptográfica real.
              </p>
            </div>

            <form onSubmit={handleVerificarPin} className="mt-5 space-y-4">
              <div>
                <label htmlFor="pin-input" className="block text-[13px] font-medium text-ink mb-1">
                  Introduce el PIN de 4 dígitos:
                </label>
                <input
                  id="pin-input"
                  type="password"
                  maxLength={4}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  autoFocus
                  value={pinIngresado}
                  onChange={(e) => {
                    setPinIngresado(e.target.value);
                    if (errorPin) setErrorPin(null);
                  }}
                  placeholder="2026"
                  className="w-full rounded-[12px] border border-control bg-raised px-4 py-2.5 text-center font-mono text-[20px] tracking-widest text-ink focus:border-ink focus:outline-none"
                />
                {errorPin && (
                  <p className="mt-2 text-[12px] text-negative font-medium" role="alert">
                    {errorPin}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalPinAbierto(false)}
                  className="h-10 rounded-full px-4 text-[13px] text-muted hover:bg-raised hover:text-ink transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-10 rounded-full bg-ink px-5 text-[13px] font-medium text-white hover:bg-black transition-colors"
                >
                  Acceder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
