import React, { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit3,
  Download,
  Upload,
  History,
  AlertTriangle,
  CheckCircle2,
  X,
  Eye,
  Check,
  FileText,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
} from 'lucide-react';
import { LetraRIASEC } from '../perfil';
import { NOMBRES_LETRAS_RIASEC } from '../reglas';
import {
  ItemCuestionarioCompleto,
  PreguntaAñadida,
  RegistroCambioConocimiento,
  calcularBalanceDimensiones,
  esPreguntaDuplicada,
  guardarPreguntasAñadidas,
  obtenerRegistroCambios,
  obtenerTodasLasPreguntas,
  registrarCambio,
  siguienteIdPregunta,
} from '../preguntasExpert';

interface ModoExpertoProps {
  preguntasAñadidas: PreguntaAñadida[];
  onActualizarPreguntas: (nuevas: PreguntaAñadida[]) => void;
  onVolver: () => void;
}

type PestañaExperto = 'preguntas' | 'nueva' | 'historial' | 'transferencia';

const PALABRAS_GUSTO = ['Nada', 'Poco', 'Algo', 'Bastante', 'Mucho'];
const PALABRAS_IMPORTANCIA = ['Nada', 'Poco', 'Algo', 'Bastante', 'Fundamental'];

export const ModoExperto: React.FC<ModoExpertoProps> = ({
  preguntasAñadidas,
  onActualizarPreguntas,
  onVolver,
}) => {
  const [pestaña, setPestaña] = useState<PestañaExperto>('preguntas');
  const [filtroLetra, setFiltroLetra] = useState<string>('todas');

  // Formulario de nueva / editar pregunta
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [formTexto, setFormTexto] = useState('');
  const [formLetra, setFormLetra] = useState<LetraRIASEC>('r');
  const [formRasgo, setFormRasgo] = useState('');
  const [formFuente, setFormFuente] = useState('');
  const [formAutor, setFormAutor] = useState('');
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [exitoForm, setExitoForm] = useState<string | null>(null);

  // Modal de confirmación de eliminación
  const [preguntaAEliminar, setPreguntaAEliminar] = useState<PreguntaAñadida | null>(null);

  // Registro de cambios
  const [historialCambios, setHistorialCambios] = useState<RegistroCambioConocimiento[]>(() =>
    obtenerRegistroCambios()
  );

  // Mensaje de importación / exportación
  const [mensajeTransferencia, setMensajeTransferencia] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(
    null
  );

  const todasLasPreguntas = obtenerTodasLasPreguntas(preguntasAñadidas);
  const preguntasActivas = todasLasPreguntas.filter((p) => p.origen === 'base' || p.activa !== false);
  const balance = calcularBalanceDimensiones(preguntasActivas);

  const limpiarFormulario = () => {
    setEditandoId(null);
    setFormTexto('');
    setFormLetra('r');
    setFormRasgo('');
    setFormFuente('');
    setFormAutor('');
    setErrorForm(null);
    setExitoForm(null);
  };

  const iniciarEdicion = (pregunta: PreguntaAñadida) => {
    setEditandoId(pregunta.id);
    setFormTexto(pregunta.texto);
    setFormLetra(pregunta.letra);
    setFormRasgo(pregunta.rasgoHolland);
    setFormFuente(pregunta.fuente);
    setFormAutor(pregunta.autor);
    setErrorForm(null);
    setExitoForm(null);
    setPestaña('nueva');
  };

  const handleGuardarPregunta = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorForm(null);
    setExitoForm(null);

    const textoLimpio = formTexto.trim();
    if (textoLimpio.length < 10 || textoLimpio.length > 120) {
      setErrorForm('El texto debe tener entre 10 y 120 caracteres y estar redactado como actividad.');
      return;
    }

    if (!formRasgo.trim()) {
      setErrorForm('Debes especificar qué rasgo de la tipología de Holland evalúa esta actividad.');
      return;
    }

    if (!formFuente.trim()) {
      setErrorForm('Indica la fuente o justificación pedagógica/curricular de la pregunta.');
      return;
    }

    if (!formAutor.trim()) {
      setErrorForm('Por trazabilidad, es obligatorio indicar el nombre del autor o departamento orientador.');
      return;
    }

    // Validación de duplicados
    const checkDup = esPreguntaDuplicada(textoLimpio, editandoId ?? undefined, preguntasAñadidas);
    if (checkDup.duplicada) {
      setErrorForm(
        `Pregunta duplicada o casi idéntica a la existente (#${checkDup.idCoincidente}): "${checkDup.textoOriginal}". Elige una formulación diferente.`
      );
      return;
    }

    const fechaHoy = new Date().toISOString().split('T')[0];

    if (editandoId !== null) {
      // Modificar existente
      const actualizadas = preguntasAñadidas.map((p) => {
        if (p.id === editandoId) {
          return {
            ...p,
            texto: textoLimpio,
            letra: formLetra,
            rasgoHolland: formRasgo.trim(),
            fuente: formFuente.trim(),
            autor: formAutor.trim(),
            fecha: fechaHoy,
          };
        }
        return p;
      });

      guardarPreguntasAñadidas(actualizadas);
      onActualizarPreguntas(actualizadas);

      registrarCambio({
        autor: formAutor.trim(),
        accion: 'modificacion',
        preguntaId: editandoId,
        preguntaTexto: textoLimpio,
        detalle: `Modificación de texto y rasgo vocacional (${formLetra.toUpperCase()})`,
      });
      setHistorialCambios(obtenerRegistroCambios());

      setExitoForm('Pregunta actualizada correctamente en la base de conocimiento.');
    } else {
      // Nueva pregunta
      const nuevoId = siguienteIdPregunta(preguntasAñadidas);
      const nueva: PreguntaAñadida = {
        id: nuevoId,
        letra: formLetra,
        texto: textoLimpio,
        rasgoHolland: formRasgo.trim(),
        fuente: formFuente.trim(),
        autor: formAutor.trim(),
        fecha: fechaHoy,
        activa: true,
        origen: 'añadida',
      };

      const actualizadas = [...preguntasAñadidas, nueva];
      guardarPreguntasAñadidas(actualizadas);
      onActualizarPreguntas(actualizadas);

      registrarCambio({
        autor: formAutor.trim(),
        accion: 'alta',
        preguntaId: nuevoId,
        preguntaTexto: textoLimpio,
        detalle: `Alta de nueva pregunta en dimensión ${formLetra.toUpperCase()}`,
      });
      setHistorialCambios(obtenerRegistroCambios());

      setExitoForm(`Pregunta #${nuevoId} añadida con éxito a la base de conocimiento.`);
    }

    setTimeout(() => {
      limpiarFormulario();
      setPestaña('preguntas');
    }, 1200);
  };

  const toggleEstadoPregunta = (pregunta: PreguntaAñadida) => {
    const nuevoEstado = !pregunta.activa;
    const actualizadas = preguntasAñadidas.map((p) => {
      if (p.id === pregunta.id) {
        return { ...p, activa: nuevoEstado };
      }
      return p;
    });

    guardarPreguntasAñadidas(actualizadas);
    onActualizarPreguntas(actualizadas);

    registrarCambio({
      autor: 'Modo Experto',
      accion: nuevoEstado ? 'activacion' : 'desactivacion',
      preguntaId: pregunta.id,
      preguntaTexto: pregunta.texto,
      detalle: nuevoEstado ? 'Reactivación para el cuestionario' : 'Desactivación temporal',
    });
    setHistorialCambios(obtenerRegistroCambios());
  };

  const confirmarEliminacion = () => {
    if (!preguntaAEliminar) return;

    const actualizadas = preguntasAñadidas.filter((p) => p.id !== preguntaAEliminar.id);
    guardarPreguntasAñadidas(actualizadas);
    onActualizarPreguntas(actualizadas);

    registrarCambio({
      autor: 'Modo Experto',
      accion: 'eliminacion',
      preguntaId: preguntaAEliminar.id,
      preguntaTexto: preguntaAEliminar.texto,
      detalle: 'Eliminación permanente de pregunta añadida',
    });
    setHistorialCambios(obtenerRegistroCambios());
    setPreguntaAEliminar(null);
  };

  // Exportar conocimiento a JSON
  const handleExportar = () => {
    const data = {
      version: '1.0',
      fechaExportacion: new Date().toISOString(),
      descripcion: 'Base de conocimiento experta para Orientador FP y Universidad',
      preguntasAñadidas,
      registroCambios: historialCambios,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conocimiento_orientador_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setMensajeTransferencia({
      tipo: 'ok',
      texto: `Exportación completada: ${preguntasAñadidas.length} preguntas añadidas y ${historialCambios.length} registros descargados.`,
    });
  };

  // Importar conocimiento desde JSON
  const handleImportar = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMensajeTransferencia(null);
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = (event) => {
      try {
        const contenido = event.target?.result as string;
        const parsed = JSON.parse(contenido);

        if (!parsed || typeof parsed !== 'object') {
          throw new Error('El archivo no contiene un objeto JSON válido.');
        }

        const importadas = parsed.preguntasAñadidas;
        if (!Array.isArray(importadas)) {
          throw new Error('Formato inválido: falta la propiedad "preguntasAñadidas" como array.');
        }

        // Validar cada elemento
        for (const p of importadas) {
          if (
            typeof p.id !== 'number' ||
            !['r', 'i', 'a', 's', 'e', 'c'].includes(p.letra) ||
            typeof p.texto !== 'string' ||
            p.texto.length < 5
          ) {
            throw new Error(`Elemento con formato inválido en pregunta con ID ${p.id || 'desconocido'}.`);
          }
        }

        // Sanitizar y asegurar origen: 'añadida'
        const preguntasSanitizadas: PreguntaAñadida[] = importadas.map((p) => ({
          id: p.id,
          letra: p.letra,
          texto: p.texto,
          rasgoHolland: p.rasgoHolland || 'Rasgo psicométrico importado',
          fuente: p.fuente || 'Archivo importado',
          autor: p.autor || 'Importador',
          fecha: p.fecha || new Date().toISOString().split('T')[0],
          activa: p.activa !== false,
          origen: 'añadida',
        }));

        guardarPreguntasAñadidas(preguntasSanitizadas);
        onActualizarPreguntas(preguntasSanitizadas);

        const cambiosImportados = Array.isArray(parsed.registroCambios) ? parsed.registroCambios : [];
        if (cambiosImportados.length > 0) {
          localStorage.setItem(
            'orientador_registro_cambios',
            JSON.stringify([...cambiosImportados, ...historialCambios].slice(0, 100))
          );
        }

        registrarCambio({
          autor: 'Modo Experto',
          accion: 'importacion',
          preguntaId: 0,
          preguntaTexto: `Importación de ${preguntasSanitizadas.length} preguntas`,
          detalle: `Archivo: ${archivo.name}`,
        });

        setHistorialCambios(obtenerRegistroCambios());
        setMensajeTransferencia({
          tipo: 'ok',
          texto: `Conocimiento importado con éxito: ${preguntasSanitizadas.length} preguntas cargadas en la base.`,
        });
      } catch (err: any) {
        console.error('Error al importar archivo de conocimiento:', err);
        setMensajeTransferencia({
          tipo: 'error',
          texto: `No se pudo importar el archivo: ${err.message || 'Estructura JSON incorrecta'}.`,
        });
      }
    };

    lector.readAsText(archivo);
    e.target.value = '';
  };

  const preguntasFiltradas = todasLasPreguntas.filter((p) => {
    if (filtroLetra === 'todas') return true;
    return p.letra === filtroLetra;
  });

  return (
    <div className="mx-auto max-w-[960px] pb-16 space-y-8">
      {/* Cabecera del Modo Experto */}
      <div className="flex flex-col gap-4 border-b border-rule pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={onVolver}
            className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Orientador de Estudiantes
          </button>
          <h1 className="font-serif text-[32px] leading-tight text-ink sm:text-[40px]">
            Modo Experto: Base de Conocimiento Vocacional
          </h1>
          <p className="mt-1 text-[14px] text-muted max-w-2xl">
            Herramienta pedagógica para orientadores de Euskadi. Permite auditar las 18 preguntas base de Holland y
            añadir nuevas actividades sin alterar el motor lógico de Prolog.
          </p>
        </div>

        <button
          type="button"
          onClick={onVolver}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-[13px] font-medium text-white transition-colors hover:bg-black active:scale-[0.98] self-start sm:self-center"
        >
          Finalizar y salir
        </button>
      </div>

      {/* Aviso de protección básica */}
      <div className="rounded-[14px] border border-warning-line bg-warning-soft px-4 py-3 text-[13px] text-warning flex items-start gap-3">
        <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          <strong>Protección básica activada (PIN 2026):</strong> Esta barrera está pensada para evitar modificaciones
          accidentales por parte de estudiantes en el aula o biblioteca escolar. No constituye seguridad criptográfica
          ni almacenamiento en la nube; todos los cambios persisten en el almacenamiento local de este navegador.
        </p>
      </div>

      {/* Panel de métricas psicométricas y balance RIASEC */}
      <div className="rounded-[18px] bg-surface p-5 border border-line space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[14px] font-medium text-ink">Balance psicométrico RIASEC</h2>
          <span className="text-[12px] text-muted">
            {preguntasActivas.length} preguntas activas en total (18 base + {preguntasAñadidas.filter((p) => p.activa).length} añadidas)
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
          {(['r', 'i', 'a', 's', 'e', 'c'] as LetraRIASEC[]).map((letra) => {
            const conteo = balance.conteoPorLetra[letra] || 0;
            const esSobrecarga = conteo > 5;
            return (
              <div
                key={letra}
                className={`rounded-[12px] border p-3 text-center transition-colors ${
                  esSobrecarga
                    ? 'border-warning-line bg-warning-soft'
                    : 'border-line bg-raised'
                }`}
              >
                <span className="font-serif text-[20px] font-bold text-accent uppercase">{letra}</span>
                <p className="text-[11px] text-muted truncate">{NOMBRES_LETRAS_RIASEC[letra]?.nombre.split(' ')[0]}</p>
                <p className="num text-[16px] font-medium text-ink mt-0.5">{conteo}</p>
              </div>
            );
          })}
        </div>

        {/* Advertencias psicométricas */}
        {(balance.alertaSobrecarga.length > 0 || balance.alertaDesbalance) && (
          <div className="space-y-1.5 pt-1 text-[12px] text-warning">
            {balance.alertaSobrecarga.map((item) => (
              <p key={item.letra} className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                La dimensión <strong>{item.letra.toUpperCase()}</strong> supera las 5 preguntas ({item.total}). Puede sesgar la ponderación hacia esta área.
              </p>
            ))}
            {balance.alertaDesbalance && (
              <p className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Desbalance notable: la diferencia entre la dimensión con más preguntas ({balance.maxPreguntas}) y la que tiene menos ({balance.minPreguntas}) es mayor que 2. Se recomienda equilibrar las áreas.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Navegación por pestañas */}
      <div className="flex flex-wrap gap-1 border-b border-rule pb-2">
        <button
          type="button"
          onClick={() => {
            setPestaña('preguntas');
            limpiarFormulario();
          }}
          className={`flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium transition-colors ${
            pestaña === 'preguntas' ? 'bg-ink text-white' : 'text-muted hover:bg-surface hover:text-ink'
          }`}
        >
          Banco de preguntas ({todasLasPreguntas.length})
        </button>

        <button
          type="button"
          onClick={() => {
            setPestaña('nueva');
            limpiarFormulario();
          }}
          className={`flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium transition-colors ${
            pestaña === 'nueva' ? 'bg-ink text-white' : 'text-muted hover:bg-surface hover:text-ink'
          }`}
        >
          <Plus className="h-4 w-4" />
          {editandoId ? `Editar pregunta #${editandoId}` : 'Añadir nueva pregunta'}
        </button>

        <button
          type="button"
          onClick={() => setPestaña('historial')}
          className={`flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium transition-colors ${
            pestaña === 'historial' ? 'bg-ink text-white' : 'text-muted hover:bg-surface hover:text-ink'
          }`}
        >
          <History className="h-4 w-4" />
          Registro de cambios ({historialCambios.length})
        </button>

        <button
          type="button"
          onClick={() => setPestaña('transferencia')}
          className={`flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium transition-colors ${
            pestaña === 'transferencia' ? 'bg-ink text-white' : 'text-muted hover:bg-surface hover:text-ink'
          }`}
        >
          <Download className="h-4 w-4" />
          Importar / Exportar
        </button>
      </div>

      {/* PESTAÑA 1: LISTA DE PREGUNTAS */}
      {pestaña === 'preguntas' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-[12px] text-muted mr-1">Filtrar:</span>
              {['todas', 'r', 'i', 'a', 's', 'e', 'c'].map((letra) => (
                <button
                  key={letra}
                  type="button"
                  onClick={() => setFiltroLetra(letra)}
                  className={`h-7 rounded-full px-2.5 text-[12px] font-medium transition-colors ${
                    filtroLetra === letra
                      ? 'bg-ink text-white'
                      : 'border border-line bg-raised text-muted hover:text-ink'
                  }`}
                >
                  {letra === 'todas' ? 'Todas' : letra.toUpperCase()}
                </button>
              ))}
            </div>

            <p className="text-[12px] text-muted">
              Mostrando {preguntasFiltradas.length} de {todasLasPreguntas.length} preguntas
            </p>
          </div>

          <div className="divide-y divide-rule rounded-[18px] border border-line bg-raised overflow-hidden">
            {preguntasFiltradas.map((p) => {
              const esBase = p.origen === 'base';
              const esActiva = p.activa !== false;

              return (
                <div
                  key={p.id}
                  className={`p-4 sm:p-5 transition-colors ${
                    !esActiva ? 'opacity-50 bg-[#fafafa]' : 'hover:bg-[#fafaf9]'
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="num flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[12px] font-bold text-white uppercase">
                          {p.letra}
                        </span>
                        <span className="num text-[12px] text-muted font-mono">#{p.id}</span>
                        {esBase ? (
                          <span className="rounded-full bg-active px-2.5 py-0.5 text-[11px] font-medium text-muted">
                            Base oficial (no editable)
                          </span>
                        ) : (
                          <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-medium text-accent">
                            Añadida por experto
                          </span>
                        )}
                        {!esActiva && (
                          <span className="rounded-full bg-warning-soft border border-warning-line px-2 py-0.5 text-[11px] text-warning font-medium">
                            Desactivada
                          </span>
                        )}
                      </div>

                      <h3 className="text-[16px] font-medium text-ink pt-1">{p.texto}</h3>
                      <p className="text-[13px] text-muted leading-relaxed">
                        <strong className="text-ink font-normal">Rasgo:</strong> {p.rasgoHolland}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted pt-1">
                        <span>Fuente: {p.fuente}</span>
                        <span>·</span>
                        <span>Autor: {p.autor}</span>
                        <span>·</span>
                        <span>Fecha: {p.fecha}</span>
                      </div>
                    </div>

                    {/* Acciones para preguntas añadidas */}
                    {!esBase && (
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-start pt-2 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => toggleEstadoPregunta(p as PreguntaAñadida)}
                          title={esActiva ? 'Desactivar pregunta' : 'Activar pregunta'}
                          className="flex h-8 items-center gap-1 rounded-[8px] border border-line px-2.5 text-[12px] text-ink hover:bg-surface transition-colors"
                        >
                          {esActiva ? (
                            <>
                              <ToggleRight className="h-4 w-4 text-accent" />
                              <span>Activa</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="h-4 w-4 text-muted" />
                              <span>Inactiva</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => iniciarEdicion(p as PreguntaAñadida)}
                          className="flex h-8 items-center gap-1 rounded-[8px] border border-line px-2.5 text-[12px] text-ink hover:bg-surface transition-colors"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPreguntaAEliminar(p as PreguntaAñadida)}
                          className="flex h-8 items-center gap-1 rounded-[8px] border border-line px-2.5 text-[12px] text-negative hover:bg-negative-soft transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Borrar</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PESTAÑA 2: FORMULARIO NUEVA / EDITAR PREGUNTA */}
      {pestaña === 'nueva' && (
        <div className="grid gap-8 lg:grid-cols-12">
          <form onSubmit={handleGuardarPregunta} className="space-y-5 lg:col-span-7">
            <div className="border-b border-rule pb-3">
              <h2 className="text-[18px] font-medium text-ink">
                {editandoId ? `Modificar pregunta añadida #${editandoId}` : 'Crear nueva pregunta de evaluación'}
              </h2>
              <p className="text-[13px] text-muted">
                Redacta una actividad clara que represente una acción profesional o académica concreta.
              </p>
            </div>

            {errorForm && (
              <div role="alert" className="rounded-[12px] border border-negative bg-negative-soft p-3 text-[13px] text-negative-ink flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-negative" />
                <span>{errorForm}</span>
              </div>
            )}

            {exitoForm && (
              <div role="status" className="rounded-[12px] border border-positive bg-emerald-50 p-3 text-[13px] text-positive flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{exitoForm}</span>
              </div>
            )}

            {/* Texto de la actividad */}
            <div>
              <div className="flex items-baseline justify-between">
                <label htmlFor="form-texto" className="text-[13px] font-medium text-ink">
                  Texto de la actividad <span className="text-negative">*</span>
                </label>
                <span className={`num text-[11px] ${formTexto.length > 120 || formTexto.length < 10 ? 'text-negative' : 'text-muted'}`}>
                  {formTexto.length}/120 caracteres
                </span>
              </div>
              <textarea
                id="form-texto"
                rows={2}
                value={formTexto}
                onChange={(e) => setFormTexto(e.target.value)}
                placeholder="Ejemplo: Diseñar una aplicación móvil o prototipar una interfaz"
                className="mt-1.5 w-full rounded-[12px] border border-line bg-raised p-3 text-[14px] text-ink placeholder:text-muted focus:border-ink focus:outline-none"
              />
              <p className="mt-1 text-[12px] text-muted">
                Debe ser una actividad en infinitivo (10–120 caracteres), comprensible para alumnado de 16–18 años.
              </p>
            </div>

            {/* Dimensión RIASEC */}
            <div>
              <label className="text-[13px] font-medium text-ink block mb-2">
                Dimensión RIASEC <span className="text-negative">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {(['r', 'i', 'a', 's', 'e', 'c'] as LetraRIASEC[]).map((letra) => {
                  const sel = formLetra === letra;
                  return (
                    <button
                      key={letra}
                      type="button"
                      onClick={() => setFormLetra(letra)}
                      className={`p-2.5 rounded-[12px] border text-left transition-colors ${
                        sel ? 'border-ink bg-ink text-white' : 'border-line bg-raised text-ink hover:border-control'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-serif text-[18px] font-bold uppercase">{letra}</span>
                        {sel && <Check className="h-3.5 w-3.5" />}
                      </div>
                      <p className={`text-[11px] truncate ${sel ? 'text-white/80' : 'text-muted'}`}>
                        {NOMBRES_LETRAS_RIASEC[letra]?.nombre.split(' ')[0]}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rasgo medido de Holland */}
            <div>
              <label htmlFor="form-rasgo" className="text-[13px] font-medium text-ink block">
                Rasgo específico de la tipología de Holland <span className="text-negative">*</span>
              </label>
              <input
                id="form-rasgo"
                type="text"
                value={formRasgo}
                onChange={(e) => setFormRasgo(e.target.value)}
                placeholder="Ejemplo: Preferencia por actividades analíticas, desarrollo de software y computación"
                className="mt-1.5 h-10 w-full rounded-[10px] border border-line bg-raised px-3 text-[13px] text-ink placeholder:text-muted focus:border-ink focus:outline-none"
              />
            </div>

            {/* Fuente / Justificación */}
            <div>
              <label htmlFor="form-fuente" className="text-[13px] font-medium text-ink block">
                Fuente o justificación pedagógica <span className="text-negative">*</span>
              </label>
              <input
                id="form-fuente"
                type="text"
                value={formFuente}
                onChange={(e) => setFormFuente(e.target.value)}
                placeholder="Ejemplo: Catálogo de Familias Profesionales de Euskadi / Cuestionario SDS adaptado"
                className="mt-1.5 h-10 w-full rounded-[10px] border border-line bg-raised px-3 text-[13px] text-ink placeholder:text-muted focus:border-ink focus:outline-none"
              />
            </div>

            {/* Autor */}
            <div>
              <label htmlFor="form-autor" className="text-[13px] font-medium text-ink block">
                Autor o centro orientador <span className="text-negative">*</span>
              </label>
              <input
                id="form-autor"
                type="text"
                value={formAutor}
                onChange={(e) => setFormAutor(e.target.value)}
                placeholder="Ejemplo: Departamento de Orientación - IES Donostia"
                className="mt-1.5 h-10 w-full rounded-[10px] border border-line bg-raised px-3 text-[13px] text-ink placeholder:text-muted focus:border-ink focus:outline-none"
              />
            </div>

            {/* Botones de acción del formulario */}
            <div className="flex items-center gap-3 pt-4 border-t border-rule">
              <button
                type="submit"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-6 font-medium text-white transition-colors hover:bg-black active:scale-[0.98]"
              >
                <Check className="h-4 w-4" />
                {editandoId ? 'Guardar cambios' : 'Añadir al cuestionario'}
              </button>

              <button
                type="button"
                onClick={limpiarFormulario}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-control px-4 text-muted hover:text-ink hover:border-ink transition-colors"
              >
                Limpiar
              </button>
            </div>
          </form>

          {/* VISTA PREVIA INTERACTIVA EN TIEMPO REAL */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center gap-1.5 text-[13px] text-muted">
              <Eye className="h-4 w-4 text-accent" />
              <span>Vista previa de la tarjeta para el estudiante:</span>
            </div>

            <div className="rounded-[22px] bg-surface p-5 sm:p-6 border border-line space-y-6">
              <div>
                <h3 className="font-serif text-[26px] leading-[1.15] text-ink">
                  {formTexto.trim() || 'Texto de la actividad orientadora'}
                </h3>
                <p className="mt-2 text-[12px] text-muted">
                  Área {NOMBRES_LETRAS_RIASEC[formLetra]?.nombre.replace(/ \(.\)$/, '').toLowerCase()}
                </p>
              </div>

              {/* Escala Gusto */}
              <div>
                <p className="text-[13px] font-medium text-ink">¿Cuánto te gusta?</p>
                <div className="mt-2 grid grid-cols-5 gap-1 rounded-full border border-line bg-raised p-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      className="num h-8 rounded-full text-[13px] flex items-center justify-center text-muted"
                    >
                      {n}
                    </div>
                  ))}
                </div>
                <div className="mt-1 flex justify-between px-2 text-[11px] text-muted">
                  <span>Nada</span>
                  <span>Mucho</span>
                </div>
              </div>

              {/* Escala Importancia */}
              <div>
                <p className="text-[13px] font-medium text-ink">
                  ¿Cuánto te importa que forme parte de tus estudios o tu trabajo?
                </p>
                <div className="mt-2 grid grid-cols-5 gap-1 rounded-full border border-line bg-raised p-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      className="num h-8 rounded-full text-[13px] flex items-center justify-center text-muted"
                    >
                      {n}
                    </div>
                  ))}
                </div>
                <div className="mt-1 flex justify-between px-2 text-[11px] text-muted">
                  <span>Nada</span>
                  <span>Fundamental</span>
                </div>
              </div>

              <div className="rounded-[10px] bg-accent-soft p-3 text-[11px] text-accent leading-relaxed">
                Si un estudiante marca gusto ≤ 2 e importancia ≥ 4, se asertará <code className="font-mono">rechazo({formLetra})</code>, penalizando con −1 punto las opciones de esta área.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: HISTORIAL DE CAMBIOS */}
      {pestaña === 'historial' && (
        <div className="space-y-4">
          <div className="border-b border-rule pb-2 flex items-center justify-between">
            <h2 className="text-[16px] font-medium text-ink">Registro de auditoría del conocimiento</h2>
            <span className="text-[12px] text-muted">{historialCambios.length} eventos registrados</span>
          </div>

          {historialCambios.length === 0 ? (
            <p className="text-center py-8 text-[13px] text-muted bg-surface rounded-[14px]">
              No hay cambios registrados en esta sesión. Cualquier alta, edición o borrado se anotará aquí con fecha y autor.
            </p>
          ) : (
            <div className="divide-y divide-rule rounded-[18px] border border-line bg-raised overflow-hidden">
              {historialCambios.map((reg) => (
                <div key={reg.id} className="p-4 text-[13px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-ink flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] uppercase font-bold ${
                          reg.accion === 'alta'
                            ? 'bg-emerald-100 text-emerald-800'
                            : reg.accion === 'eliminacion'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-active text-ink'
                        }`}
                      >
                        {reg.accion}
                      </span>
                      <span>Pregunta #{reg.preguntaId}</span>
                    </span>
                    <span className="num text-[11px] text-muted">{reg.fecha}</span>
                  </div>
                  <p className="text-ink">{reg.preguntaTexto}</p>
                  <p className="text-[12px] text-muted">
                    Autor: {reg.autor} {reg.detalle ? `· ${reg.detalle}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 4: IMPORTAR / EXPORTAR */}
      {pestaña === 'transferencia' && (
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Exportar */}
          <div className="rounded-[18px] bg-surface p-6 border border-line space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-ink font-medium">
                <Download className="h-5 w-5 text-accent" />
                <h2 className="text-[16px]">Exportar conocimiento</h2>
              </div>
              <p className="mt-2 text-[13px] text-muted leading-relaxed">
                Descarga un archivo JSON estructurado con las {preguntasAñadidas.length} preguntas añadidas y el
                registro de auditoría. Permite compartir las preguntas con otros centros educativos o guardarlas como copia de seguridad.
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportar}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 text-[13px] font-medium text-white transition-colors hover:bg-black active:scale-[0.98] w-full"
            >
              <Download className="h-4 w-4" />
              Descargar archivo JSON
            </button>
          </div>

          {/* Importar */}
          <div className="rounded-[18px] bg-surface p-6 border border-line space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-ink font-medium">
                <Upload className="h-5 w-5 text-accent" />
                <h2 className="text-[16px]">Importar conocimiento</h2>
              </div>
              <p className="mt-2 text-[13px] text-muted leading-relaxed">
                Carga un archivo de preguntas previamente exportado. El sistema valida la integridad de los datos
                y rechaza archivos con formato erróneo para proteger el funcionamiento del sistema experto.
              </p>
            </div>

            <label className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-control px-5 text-[13px] font-medium text-ink hover:border-ink transition-colors cursor-pointer w-full text-center">
              <Upload className="h-4 w-4" />
              <span>Seleccionar archivo JSON</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleImportar}
                className="hidden"
              />
            </label>
          </div>

          {mensajeTransferencia && (
            <div
              className={`sm:col-span-2 rounded-[14px] p-4 text-[13px] flex items-start gap-2.5 ${
                mensajeTransferencia.tipo === 'ok'
                  ? 'border border-positive bg-emerald-50 text-positive'
                  : 'border border-negative bg-negative-soft text-negative-ink'
              }`}
            >
              {mensajeTransferencia.tipo === 'ok' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              )}
              <span>{mensajeTransferencia.texto}</span>
            </div>
          )}
        </div>
      )}

      {/* DIÁLOGO MODAL DE CONFIRMACIÓN DE BORRADO */}
      {preguntaAEliminar && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
        >
          <div className="w-full max-w-md rounded-[22px] bg-raised p-6 flota border border-line space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-medium text-ink">¿Eliminar pregunta de la base?</h3>
              <button
                type="button"
                onClick={() => setPreguntaAEliminar(null)}
                className="text-muted hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-[13px] text-muted leading-relaxed">
              Estás a punto de eliminar permanentemente la pregunta <strong>#{preguntaAEliminar.id}</strong>:
            </p>

            <blockquote className="border-l-2 border-accent pl-3 text-[13px] text-ink italic">
              «{preguntaAEliminar.texto}»
            </blockquote>

            <p className="text-[12px] text-negative">
              Esta acción quedará registrada en el historial de cambios y la pregunta dejará de aparecer en futuros cuestionarios.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPreguntaAEliminar(null)}
                className="h-9 rounded-full px-4 text-[13px] text-muted hover:text-ink"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEliminacion}
                className="h-9 rounded-full bg-negative px-5 text-[13px] font-medium text-white hover:bg-red-700 transition-colors"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
