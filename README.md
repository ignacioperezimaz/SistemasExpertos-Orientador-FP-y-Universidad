# Orientador FP y Universidad

Sistema experto de orientación académica dirigido a estudiantes de **1.º y 2.º de Bachillerato de Euskadi**. Ayuda a explorar dos itinerarios después del Bachillerato: **FP de Grado Superior** (por familia profesional) y **universidad** (por rama de conocimiento).

**Aplicación web:** https://orientador-fp-y-universidad.ai.studio/

## ¿Qué hace la aplicación?

1. Recoge información académica: curso, modalidad de Bachillerato, materias y preferencias formativas.
2. Presenta un cuestionario de intereses basado en el modelo **RIASEC de Holland**: Realista (R), Investigador (I), Artístico (A), Social (S), Emprendedor (E) y Convencional (C).
3. Calcula un perfil de intereses y obtiene recomendaciones de familias de FP de Grado Superior y ramas universitarias.
4. Muestra puntuaciones, avisos y un apartado **«Por qué te sale esto»** para explicar los resultados y las reglas utilizadas.
5. Dispone de un **modo experto** con el que se pueden añadir, modificar o eliminar preguntas, así como importar y exportar preguntas y el registro de cambios mediante archivos JSON.

El sistema contempla las ramas universitarias de **UPV/EHU, Universidad de Deusto y Mondragon Unibertsitatea**. No recomienda grados o ciclos concretos ni concede plazas.

## Cómo utilizarlo

1. Abre el enlace de la aplicación.
2. Completa la pantalla de datos académicos.
3. Responde al cuestionario indicando para cada actividad **cuánto te gusta** y **qué importancia tiene** (escalas de 1 a 5).
4. Consulta los resultados: perfil RIASEC, opciones recomendadas y explicaciones.
5. Si quieres entender la recomendación, abre **«Por qué te sale esto»**.

La aplicación también ofrece ejemplos predefinidos para probar perfiles distintos.

## Ejemplo de funcionamiento

**Caso de Ingeniería y tecnología (P01).** Un perfil con puntuaciones **I = 5, R = 5 y A = 3** obtiene, entre otras, una recomendación de **Ingeniería y Arquitectura** con una afinidad de **4,33 sobre 5**:

`(5 + 5 + 3) / 3 = 4,33`

**Caso de rechazo (P04).** Si un estudiante puntúa las actividades de Convencional con **gusto = 1** e **importancia = 5**, el sistema detecta un rechazo y penaliza las opciones asociadas a esa dimensión.

Estos ejemplos describen las pruebas realizadas sobre la aplicación y no constituyen recomendaciones válidas para todos los estudiantes.

## Cómo se calculan las recomendaciones

El cuestionario original incluye **18 preguntas, tres por cada dimensión RIASEC**. Para cada dimensión se utiliza una media ponderada por la importancia de las respuestas:

`puntuación = suma(gusto × importancia) / suma(importancia)`

La afinidad de una opción educativa se calcula a partir de las dimensiones RIASEC asociadas a ella. Entre las condiciones de la aplicación se encuentran:

- **Rechazo:** una respuesta con gusto ≤ 2 e importancia ≥ 4 puede marcar una dimensión como rechazada. Las opciones relacionadas reciben una penalización.
- **Perfil sin interés dominante:** si las primeras dimensiones tienen puntuaciones muy próximas, se muestra un aviso.
- **Preferencia FP/universidad:** puede intervenir en la ordenación de opciones próximas, sin eliminar automáticamente las demás.
- **Avisos académicos:** se informa de limitaciones y condiciones de acceso que deben verificarse en fuentes oficiales.

La relación entre dimensiones RIASEC y opciones educativas es una **decisión orientativa del proyecto**, no una clasificación oficial de admisión.

## Tecnologías y arquitectura

- **Google AI Studio / Gemini:** entorno principal de desarrollo de la aplicación a partir de instrucciones del equipo.
- **React y TypeScript:** interfaz, gestión de las respuestas y cálculos del perfil de intereses.
- **Prolog y Tau Prolog:** representación y consulta de la base de conocimiento y sus reglas en el navegador.
- **JSON:** importación y exportación de preguntas personalizadas y registro de cambios.
- **Claude y Claude Code:** apoyo al diseño y mejoras visuales.

**Flujo general:** datos del estudiante → cuestionario RIASEC → cálculo del perfil → motor de inferencia y reglas → recomendaciones y explicaciones.

## Pruebas realizadas

La memoria del proyecto documenta pruebas de:

- P01: perfil de Ingeniería y tecnología.
- P02: perfil de Sanidad y social.
- P03: intereses repartidos o perfil plano.
- P04: rechazo hacia la dimensión Convencional.
- P05: personalización del cuestionario.
- P06: respuestas incompletas.
- P07: rechazo de un archivo JSON incorrecto.

También se realizó una comparación orientativa de recomendaciones con ChatGPT.

## Fuentes de referencia

Se utilizaron, entre otras, las siguientes fuentes para el diseño y la comprobación de información:

- [Boletín Oficial del Estado (BOE)](https://www.boe.es/) — normativa de acceso y ordenación educativa.
- [Gobierno Vasco](https://www.euskadi.eus/) — oferta y orientación sobre FP.
- [UPV/EHU](https://www.ehu.eus/) — estudios y admisión universitaria.
- [Universidad de Deusto](https://www.deusto.es/) — oferta y admisión.
- [Mondragon Unibertsitatea](https://www.mondragon.edu/) — oferta y admisión.
- [O*NET OnLine](https://www.onetonline.org/) — intereses profesionales.
- [Tau Prolog](https://tau-prolog.org/) — motor Prolog para JavaScript.

Los requisitos y las ponderaciones pueden cambiar entre cursos académicos. Antes de tomar una decisión real, deben consultarse las fuentes oficiales vigentes para el grado, ciclo y centro correspondiente.

