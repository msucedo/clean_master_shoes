Clean master shoes

// WIP 
-[FIX]agregar en orderdetailview a la foto preview como en empleadoitem
-[FIX]que una orden no pueda estar en proceso si no tiene autor
- [feature/wapp]Al momento de actualizar el estado de una orden a "En entrega" mandar un wapp al cliente de que esta listo su pedido
    -[FIX]Debuggeando porque falla

// PRIORIDAD ALTA
-[EPIC]Agregar pantalla de login, creacion de usuario unico administrador, que pueda tener varias sesiones abiertas el mismo usuario
-[feature/security_pin_para_admin]Agregar un lock a ciertas acciones de la app que solo se puedan hacer si hay un pin de confirmacion
-[FEATURE]Notificaciones push alerta cuando hay nuevas ordenes creadas desde otra sesion
-[FEATURE]Si la fecha de entrega ya pasó y el estado no es en entrega entonces en ordercard ponle retrasado, escenario 2: si la fecha de entrega ya pasó y si esta en estado en entrega ponle cliente retrasado
-[feature/lockscreen]tener una sección tipo lock screen, que se desbloquee con un security pin, la idea es si el usuario se ira por un momento no deje ahi la aplicacion a la vista de todos y asi se protega
-[FIX]volver a mostrar el emoji del servicio express en ordercard, y tambien mantener el tag urgente
-[EPIC]Pantalla promociones
-[CODE_REVIEW]Pedir code review para analizar app

// PRIORIDAD MEDIA
-[FIX]orden sin productos-al crear una orden, si solo selecciono productos, deberia de ver un boton cobrar y que haga el flip asi como ahorita pero que el campo elegir fecha no sea requerido, que el campo elegir metodo de pago si sea requerido y que en lugar de ver el boton crear orden, veas el boton cobrar y finalizar, esto porque no es necesario crear una orden si no hay servicios en juego, directamente le vamos a cobrar
-[fix]poder actualizarse el costo a un servicio cotizado desde orderdetailview, que se logre como si fuera el update del precio de un servicio en una orden pero solo este habilitado hacer esto cuando el servicio tenga 0, no quiero que las demas ordenes puedan cambiar el costo del servicio desde orderdetailview, solo cuando sea 0, y este cambio al cerrar el modal se deberia mandar a firebase porque se actualizo la orden

// PRIORIDAD BAJA
-[FIX]no poder agendar ordenes con fechas pasadas
- [FEATURE]Habilitar opcion de descuento en la paymentscreen
-[feature/smoothness]agregar animaciones para que se sienta smooth la app
- [FEATURE]Seleccionar multiples ordenes a la vez - la etiqueta de fecha de la orden, si la presionas, deberia animarse con un flip y que se llene el background del mismo color pero solido, y en ese momento esa orden queda seleccionada, despues si abro otra orden diferente, y le cambio el estado a esa 2da orden, entonces como la primera estaba seleccionada entonces tambien a esa primera se le asigna el mismo estado, asi podemos mover mas de una orden a la vez entre estados
    -[VAL]En el dashbaord validar "ingresos hoy" tambien aumente con ordenes de solo productos
-[ALTERNATIVA]si todos los servicios estan en completado, automaticamente cambia a listos la orden

// BACKLOG
-[FEATURE]notificacion cuando un cliente responda el mensaje de orden lista
-[FEATURE]habilitar metricas de la tab servicios en cada serviceitem
-[ALTERNATIVA]boton nueva orden desde el sidebar
-[FEATURE]Agregar un emoji de una usuario a ordercard cuando la orden ya tenga un autor
-[FEATURE]pagina de tracking de ordenes para la .com
-[FEATURE]crear ticket al crear la orden y mandarlo a imprimir, tambien al finalizar la orden
-[FEATURE]que al momento de agregar los items al carrito cuando se crea una orden, validar automaticamente si aplica alguna promoción a la orden y mostrar la promo y el descuento a la orden
-[FEATURE]en la orden, guardar factura al generarla
-[ALTERNATIVA]al crear una orden se asigne al empleado activo con menos ordenes
-[FIX]validar flujos en iphone, UX en iphone

     📝 Plan de Mejoras Propuesto                                                                                      
     │                                                                                                                   │
     │ Fase 1: Crítico (1-2 días)                                                                                        │
     │                                                                                                                   │
     │ 1. Implementar Error Boundary global                                                                              │
     │ 2. Agregar try-catch en todas las operaciones async                                                               │
     │ 3. Crear componente de Confirmación/Notificación                                                                  │
     │ 4. Verificar y limpiar .env del historial de git                                                                  │
     │ 5. Remover console.logs                                                                                           │
     │                                                                                                                   │
     │ Fase 2: Performance (2-3 días)                                                                                    │
     │                                                                                                                   │
     │ 6. Agregar PropTypes a todos los componentes                                                                      │
     │ 7. Implementar useCallback y useMemo donde corresponda                                                            │
     │ 8. Cambiar keys de index a IDs únicos                                                                             │
     │ 9. Implementar optimistic updates en Firebase                                                                     │
     │                                                                                                                   │
     │ Fase 3: UX/Features (3-4 días)                                                                                    │
     │                                                                                                                   │
     │ 10. Implementar validación de formularios con react-hook-form                                                     │
     │ 11. Unificar loading states                                                                                       │
     │ 12. Mejorar accesibilidad (a11y)                                                                                  │
     │ 13. Agregar tests básicos                                                                                         │
     │                                                                                                                   │
     │ Fase 4: DevOps (1 día)                                                                                            │
     │                                                                                                                   │
     │ 14. Configurar linting en pre-commit hook                                                                         │
     │ 15. Actualizar documentación                                                                                      │
     │ 16. Configurar CI/CD básico      

// COMPLETADO
-[FEATURE]webhook para wapp, ui para mostrar y recibir wapp en orderdetailview
-[FIX]se remueven 000 ceros del orden number
-[FEATURE]la lista de ordenes sin asignar de la tab empleados, hazle un sort de mas nuevas primero, de acorde al numero de orden, y que hasta arriba aparezcan las que tengan express, cambiar estado por fecha
-[FEATURE]agrega la foto de la orden ahi mismo y 3. que al darle clic al boton asignar tambien actualices el estado de la orden a en proceso,
-[FIX]no mostrar el item del servicio express, en orderdetailview, esconderlo y marcarlo siempre como completado, 2. agregar a ordercard el emoji del servicio express en caso que esa orden lo tenga
-[FEATURE]en orderdetailview, cada que presione un item de la orden, debera animarse con un flip y automaticamente cambiarse el estado en un loop al siguiente estado de la lista
-[FIX]autor para corte de caja, nueva sección historial de cortes de caja
-[FIX]added componente 404, fixed rerouting in vercel
-[FEATURE]agregado a vercel variables de firebase
-[feature/facturas]desde una orden poder generar facturas
-[fix]tab empleados,en el componente EmpleadoItem, aun lado del boton ver ordenes agregar un boton nuevo "asignar orden", se van a desplegar todas las ordenes en el estado recibido y que no tengan a un empleado asignado, cada orden desplegada va tener un boton para asignarsela al empleado
-[fix]tab clientes, ver historial, validar canceladas este bien configurado
-[feature/servicio_precio_undefined]Poder agregar un servicio sin precio definido, el cual se debe definir al momento de hacer el cobro de la orden
-[feature/corte_de_caja]Componente corte de caja
-[FIX]Cargar perfil del negocio desde firebase
-[FIX]arreglar backup manual de settings tab
-[FIX]eliminar nn components settings tab
-[feature/loading_screen]Agregar loading screen al entrar en la app
-[FEATURE]Al cancelar la orden, ya no se borra, se actualiza a cancelado y se deja para reporteria
- [fix/iphone_ux_new_order]Habilitar nueva orden en iphone, ux no se ve
-[fix/orders_priority]de orderform, remover el campo de la UI "prioridad", no debe cambiarse manualmente, por defecto a todas las ordenes ponles la prioridad de normal, cuando una orden tenga el producto express, entonces automaticamente al crear la orden ponle prioridad express
    -[fix/orders_priority]Remover el solid del background de la etiqueta urgente del ordercard en la tab ordenes
    -[fix/orders_priority]Remover de ordercard de los item badges, el emoji del servicio express, no se usrara emoji para este servicio porque se representa por la etiqueta de prioridad urgente ya definida en este componente
    -[fix/orders_priority]Organizar UX order's header cuando es urgente + entrega mañana
- [VAL]Si una orden lleva el servicio express especificarlo en la tarjeta
- [FIX]Fecha de entrega por default que sea 2 dias, pero que en la orden siga pudiendo ser editable
- [FEATURE]Filtros para ordenes - Agregar filtro de mas recientes
- [FEATURE]historial de ordenes del cliente en la tab clientes - deberia venir un boton en cada cliente que diga, "ver historial" y donde se despligue asi como en empleados puedes ver las ordenes activas, aca deberias ver la misma tipo de seccion pero con todas las clientes ya completadas de ese cliente y tambien si tiene activas
- [EPIC]Pantalla inventario
- [FIX]Al crear una orden, remover el campo de anticipo de la pantalla de pago, en caso que el usuario seleccione el metodo de pago como efectivo, entonces en la pantalla de payment, donde se ingresa el monto, si el monto es menor al total, usalo como anticipo, crea la orden pero deberia quedar con pado pendiente y el resto pendiente deberia ser correcto
-[FIX]Remover tax del paymentscreen, no calcular y borrar todo lo relacionado a eso
- [FEATURE]Al estar creando una orden, añadir logica para poder pagar en ese momento
    - [FEATURE]si seleccionas un metodo de pago, el boton "crear orden" se reemplaza por uno que diga "Cobrar y crear orden", si se hace clic en "cobrar y crear orden" entonces una animacion de flip voltea toda el modal de nueva orden, es decir, no solo el lado derecho, tambien el izquierdo pero como si fuera un solo giro no dos al mismo tiempo, y que aparezca una nueva pantalla que sea de cobrar, que aparezcan los items de la orden, el impuesto, el total
-[FEATURE]Mostrar el emoji del inventario al momento de crear la orden, agregar inventario a la orden, guardar producto en orden
-[EPIC]primero definir el funcionamiento de cobrar antes de crear una orden y despues continuar con el fix(no crear ordenes sin servicios, cobrar directo)
- [FIX]asegurarse que al entregar orden, se guarde con el ultimo estado de completado
- [FIX]Arreglar bug de múltiples notificaciones usando useRef
- [FIX]Optimizar llamadas a Firebase - Guardar orden solo al cerrar modal
- [EPIC]Fase 1
- [FEATURE]Agregar logica a nuevas etiquetas del dashboard, validar las que faltan de logica
- [FEATURE]Agregar al empleado, aun lado de la etiqueta del estatus del empelado, un boton que diga ver ordenes activas y que se desplique una sección por debajo con las ordenes que tenga de autor ese empleado
- [EPIC]Pantalla empleado
- [FIX]Remover campo salario del empleado
- [FEATURE]Agregar nuevas etiquetas de informacion en el dashboard
- [FEATURE]Agregar campo autor a cada orden, este campo se debe llenar automatico de la tab de empleados
- [FEATURE]trabajar en la tab clientes, logica para datos de cada cliente, lo que debe y como hacer un cliente vip
- [EPIC]Refactorizar localStorge para implementar firebase como base de datos
- [EPIC]Refactorizar dashboard, asegurarse que la primer sección funcione, y en la 2da mejor poner las tarjetas de la 4ta columna "En entrega"
- [EPIC]Refactorizar tarjeta de orden, unificar servicios y listas de items, crear nueva ux, usar emojis representando a los servicios
- [EPIC]Tab servicios, Agregar funcionalidad al boton de agregar servicio, remover data de prueba y establer servicios verdaderos
- [FIX]En lugar que en la columna "listos" aparezca el boton de cobrar y de entregar en los detalles de la orden, mejor quiero que eso salga en la nueva 4ta columna "En entrega", tambien cambia la validacion que no deja avanzar a "listos" hasta completar todos los items por no dejar avanzar a la nueva 4ta columna "En entrega"
- [FEATURE]En la tab ordenes, agregar una 4ta columna "En entrega"
- [UX]Nuevas tab para el sidebar: empleados, inventario y promociones
- [EPIC]nueva funcionalidad: aparte de tenis, poder aceptar ordenes de gorras y bolsas
- [VAL]La fecha de entrega no debe ser anterior a hoy
- fix: en el header, centrar el icono de la lupa, en el recuadro que lo rodea
- [VAL]En las tarjetas, si la fecha de entrega es mañana, hoy o ayer, ponerle colores, asi como ya esta ahorita pero creo sin logica solo como mockup
- [UX]ipad, en modo vertical, alinear los iconos del menu izquierdo centrados, porque estan los iconos hacia la derecha en el cuadrito que los rodea
- actualizar background del header del ipad con las tags meta
- en el componente orderDetailView, debo poder editar la fecha de entrega de una orden
- validar no poder cambiar el estado de la orden a listo hasta que todas los elementos de la orden tengan un estado de completado o de cancelado
- remover error que se pierde el cambio del estado, cuando actualizas los pares y despues los items
- en el componente orderCard, al momento que los pares de tenis o los items esten completados, quiero que actualices el color del control span que muestra el total de items, para asi indicar que ya esta completo esa parte
- ademas de tenis, tambien a veces los clientes llevan bolsas o gorras u otros items, quiero poder llevar el registro de eso tambien, en el componente orderForm, quiero un nuevo boton, igual al de "agregar otro par de tenis", y que este boton diga "agregar otro tipo de item", al hacer clic va agregar tambien un nuevo item pero el formulario debe pregunar por que tipo de item es
- refactorizar tab de ordenes, la ui de cada item de la lista de ordenes, y componentes que si se usan
- nueva funcionalidad: en la tab de ordenes, me gustaria que al actualizarle el estado a una orden, esta orden se cambie a la columna correcta automaticamente.
- Orders.jsx, es necesario el state para "editingOrder"? ya ni se puede editar la orden
- fix: barra de busqueda de la tab ordenes, las demas tabs si funciona bien
- Fix tab ordenes:
    - remover los filtros del header
    - actualizar a tarjetas verticales
- fix pantalla vista previa de la orden:
    - remover el boton editar orden
    - para los pares de tenis, agregarle un nuevo estado de cancelado, en caso que un par en especifico se necesite cancelar
    - necesito que habilites el poder agregar fotos en esta vista y no solo al agregar la orden
    - poder actualizarse el estado a la orden, solo se puede leer, y quiero editarlo asi como el estado de los pares que si se pueden editar
-fix del search bar
-fix: si a un par de tenis les pongo el status cancelado, remueve ese precio del total y tambien de la fecha de entrega

// GASTOS
- dominio .com
- dominio .company
- membresia claude max