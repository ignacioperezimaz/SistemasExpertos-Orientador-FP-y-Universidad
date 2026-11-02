:- dynamic(curso/1).
:- dynamic(modalidad/1).
:- dynamic(materia/1).
:- dynamic(contempla_privada/1).
:- dynamic(letra_usuario/2).
:- dynamic(rechazo/1).

ofrece(upv_ehu, artes_humanidades).
ofrece(upv_ehu, ciencias).
ofrece(upv_ehu, ciencias_salud).
ofrece(upv_ehu, ciencias_sociales_juridicas).
ofrece(upv_ehu, ingenieria_arquitectura).

ofrece(deusto, artes_humanidades).
ofrece(deusto, ciencias).
ofrece(deusto, ciencias_salud).
ofrece(deusto, ciencias_sociales_juridicas).
ofrece(deusto, ingenieria_arquitectura).

ofrece(mondragon, artes_humanidades).
ofrece(mondragon, ciencias_sociales_juridicas).
ofrece(mondragon, ingenieria_arquitectura).

privada(deusto).
privada(mondragon).

familia_gs(actividades_fisicas_deportivas).
familia_gs(administracion_gestion).
familia_gs(agraria).
familia_gs(artes_graficas).
familia_gs(comercio_marketing).
familia_gs(edificacion_obra_civil).
familia_gs(electricidad_electronica).
familia_gs(energia_agua).
familia_gs(fabricacion_mecanica).
familia_gs(hosteleria_turismo).
familia_gs(imagen_personal).
familia_gs(imagen_sonido).
familia_gs(industrias_alimentarias).
familia_gs(informatica_comunicaciones).
familia_gs(instalacion_mantenimiento).
familia_gs(madera_mueble_corcho).
familia_gs(maritimo_pesquera).
familia_gs(quimica).
familia_gs(sanidad).
familia_gs(seguridad_medio_ambiente).
familia_gs(servicios_socioculturales).
familia_gs(textil_confeccion_piel).
familia_gs(transporte_mantenimiento_vehiculos).

codigo(informatica_comunicaciones, [c,i,r]).
codigo(sanidad, [r,i,s,c]).
codigo(administracion_gestion, [c,e,i]).
codigo(comercio_marketing, [e,c]).
codigo(electricidad_electronica, [r,c,i]).
codigo(fabricacion_mecanica, [r,c,i]).
codigo(instalacion_mantenimiento, [r,c,i]).
codigo(transporte_mantenimiento_vehiculos, [r,c,i]).
codigo(energia_agua, [r,c,i]).
codigo(edificacion_obra_civil, [r,i,c]).
codigo(quimica, [i,r,c]).
codigo(industrias_alimentarias, [r,c,i]).
codigo(agraria, [r,i,c]).
codigo(seguridad_medio_ambiente, [r,i,c]).
codigo(hosteleria_turismo, [e,c,r]).
codigo(imagen_personal, [r,a,c]).
codigo(imagen_sonido, [r,a,c]).
codigo(artes_graficas, [a,c,r]).
codigo(textil_confeccion_piel, [a,r,e]).
codigo(madera_mueble_corcho, [r,c]).
codigo(maritimo_pesquera, [r,c,e]).
codigo(actividades_fisicas_deportivas, [s,r,e]).
codigo(servicios_socioculturales, [s,a,c]).
codigo(artes_humanidades, [a,c,i]).
codigo(ciencias, [i,r,c]).
codigo(ciencias_salud, [i,s,r]).
codigo(ciencias_sociales_juridicas, [s,c,e]).
codigo(ingenieria_arquitectura, [r,i,a]).

rama(artes_humanidades).
rama(ciencias).
rama(ciencias_salud).
rama(ciencias_sociales_juridicas).
rama(ingenieria_arquitectura).

pondera(ingenieria_arquitectura, M) :- member(M, [biologia, dibujo_tecnico_2, diseno, fisica, fundamentos_artisticos, geologia_cc_ambientales, historia_arte, ingles, euskera_literatura_2, matematicas_2, matematicas_ccss_2, quimica, tecnologia_ingenieria_2]).
pondera(ciencias, M) :- member(M, [biologia, ciencias_generales, dibujo_tecnico_2, fisica, geografia, geologia_cc_ambientales, matematicas_2, matematicas_ccss_2, quimica, tecnologia_ingenieria_2]).
pondera(ciencias_salud, M) :- member(M, [biologia, ciencias_generales, fisica, historia_filosofia, euskera_literatura_2, matematicas_2, matematicas_ccss_2, ingles, quimica]).
pondera(artes_humanidades, _).
pondera(ciencias_sociales_juridicas, _).

vinculada(informatica_comunicaciones, ingenieria_arquitectura).
vinculada(electricidad_electronica, ingenieria_arquitectura).
vinculada(fabricacion_mecanica, ingenieria_arquitectura).
vinculada(instalacion_mantenimiento, ingenieria_arquitectura).
vinculada(edificacion_obra_civil, ingenieria_arquitectura).
vinculada(energia_agua, ingenieria_arquitectura).
vinculada(transporte_mantenimiento_vehiculos, ingenieria_arquitectura).
vinculada(quimica, ciencias).
vinculada(industrias_alimentarias, ciencias).
vinculada(agraria, ciencias).
vinculada(sanidad, ciencias_salud).
vinculada(actividades_fisicas_deportivas, ciencias_sociales_juridicas).
vinculada(administracion_gestion, ciencias_sociales_juridicas).
vinculada(comercio_marketing, ciencias_sociales_juridicas).
vinculada(servicios_socioculturales, ciencias_sociales_juridicas).
vinculada(hosteleria_turismo, ciencias_sociales_juridicas).
vinculada(imagen_sonido, artes_humanidades).
vinculada(artes_graficas, artes_humanidades).
vinculada(textil_confeccion_piel, artes_humanidades).

accesible(fp(F), 'R-ACC-01') :- familia_gs(F).
accesible(uni(R), 'R-ACC-02') :- rama(R).

afinidad(Opcion, Media) :- codigo(Opcion, Letras), findall(P, (member(L, Letras), letra_usuario(L, P)), Ps), Ps \= [], sum_list(Ps, S), length(Ps, N), Media is S / N.

penalizada(Opcion, L) :- codigo(Opcion, Letras), rechazo(L), member(L, Letras).

aviso(uni(R), 'R-POND-01') :- rama(R), R \= artes_humanidades, R \= ciencias_sociales_juridicas, \+ (materia(M), pondera(R, M)).
aviso(uni(ingenieria_arquitectura), 'R-PRIO-01') :- modalidad(Mod), Mod \= ciencias_tecnologia.
aviso(uni(R), 'R-PRIV-01') :- contempla_privada(si), ofrece(U, R), privada(U).

consejo(uni(R), 'R-CURSO-01') :- curso(1), aviso(uni(R), 'R-POND-01').
consejo(uni(R), 'R-CURSO-02') :- curso(2), aviso(uni(R), 'R-POND-01').

pasarela(uni(R), fp(F), 'R-PAS-01') :- vinculada(F, R).

universidad_para(R, U) :- ofrece(U, R), (privada(U) -> contempla_privada(si) ; true).
