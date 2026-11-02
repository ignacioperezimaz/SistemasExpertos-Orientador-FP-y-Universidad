import { LetraRIASEC, ResultadoPerfil, RespuestasCuestionario } from './perfil';
import { DatosUsuario, OpcionRecomendada, ReglaDisparadaConContexto, ResultadoMotor } from './motor';
import { RespuestaExplicacion } from './explicacion';

export type PasoOrientador = 1 | 2 | 3;

export interface MateriaInfo {
  id: string;
  nombre: string;
  modalidadesComunes: Array<'ciencias_tecnologia' | 'humanidades_ccss' | 'artes' | 'general'>;
}

export const LISTA_MATERIAS: MateriaInfo[] = [
  { id: 'biologia', nombre: 'Biología', modalidadesComunes: ['ciencias_tecnologia', 'general'] },
  { id: 'fisica', nombre: 'Física', modalidadesComunes: ['ciencias_tecnologia'] },
  { id: 'quimica', nombre: 'Química', modalidadesComunes: ['ciencias_tecnologia'] },
  { id: 'matematicas_2', nombre: 'Matemáticas II', modalidadesComunes: ['ciencias_tecnologia'] },
  { id: 'matematicas_ccss_2', nombre: 'Matemáticas Aplicadas a las CCSS II', modalidadesComunes: ['humanidades_ccss', 'general'] },
  { id: 'dibujo_tecnico_2', nombre: 'Dibujo Técnico II', modalidadesComunes: ['ciencias_tecnologia', 'artes'] },
  { id: 'tecnologia_ingenieria_2', nombre: 'Tecnología e Ingeniería II', modalidadesComunes: ['ciencias_tecnologia'] },
  { id: 'geologia_cc_ambientales', nombre: 'Geología y Ciencias Ambientales', modalidadesComunes: ['ciencias_tecnologia', 'general'] },
  { id: 'ciencias_generales', nombre: 'Ciencias Generales', modalidadesComunes: ['general'] },
  { id: 'geografia', nombre: 'Geografía', modalidadesComunes: ['humanidades_ccss', 'general'] },
  { id: 'historia_arte', nombre: 'Historia del Arte', modalidadesComunes: ['humanidades_ccss', 'artes'] },
  { id: 'historia_filosofia', nombre: 'Historia de la Filosofía', modalidadesComunes: ['humanidades_ccss', 'general'] },
  { id: 'ingles', nombre: 'Inglés', modalidadesComunes: ['ciencias_tecnologia', 'humanidades_ccss', 'artes', 'general'] },
  { id: 'euskera_literatura_2', nombre: 'Lengua Vasca y Literatura II', modalidadesComunes: ['ciencias_tecnologia', 'humanidades_ccss', 'artes', 'general'] },
  { id: 'diseno', nombre: 'Diseño', modalidadesComunes: ['artes'] },
  { id: 'fundamentos_artisticos', nombre: 'Fundamentos Artísticos', modalidadesComunes: ['artes'] },
  { id: 'latin_2', nombre: 'Latín II', modalidadesComunes: ['humanidades_ccss'] },
  { id: 'griego_2', nombre: 'Griego II', modalidadesComunes: ['humanidades_ccss'] },
  { id: 'empresa_dmn', nombre: 'Empresa y Diseño de Modelos de Negocio', modalidadesComunes: ['humanidades_ccss', 'general'] },
];

export const MODALIDADES_NOMBRES: Record<string, string> = {
  ciencias_tecnologia: 'Ciencias y Tecnología',
  humanidades_ccss: 'Humanidades y Ciencias Sociales',
  artes: 'Artes',
  general: 'General',
};
