Clean master shoes

// OBJETIVO: MEJORAR EXPERIENCIA DE USUARIO

// WIP
-[EPIC]Pantalla promociones
-[]agregarle beta a la tab promociones
-[]agregar orderCreatedBy property en orders, que sea el empleado de la app el nombre que guarde
-[]buscar bugs en todos los flujos de funcionalidades

// PRIORIDAD ALTA

// PRIORIDAD MEDIA
-[FEATURE]Si la fecha de entrega ya pasó y el estado no es en entrega entonces en ordercard ponle retrasado, escenario 2: si la fecha de entrega ya pasó y si esta en estado en entrega ponle cliente retrasado
-[FEATURE]que al momento de agregar los items al carrito cuando se crea una orden, validar automaticamente si aplica alguna promoción a la orden y mostrar la promo y el descuento a la orden

// PRIORIDAD BAJA
-[FEATURE]en el header agregar icono de notificaciones y que aparezca un desplegable con las ultimas 10 notificaciones lanzadas
- [FEATURE]Habilitar opcion de descuento en la paymentscreen
-[feature/smoothness]agregar animaciones para que se sienta smooth la app
-[FEATURE]agregar notificacion push de cuando se recibe una respuesta de wapp, aparte de notificar con el badge rojo

// BACKLOG
-[]modals con ui propia
-[]agregar ux para modal al conectar impresora bluetooth
-[FEATURE]Validar funcionalidades offline

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
-[FIX]movil, menu sidebar, reorganizar emoji de admin arriba del emoji del empleado
-[FIX]reportes y corte de caja podrian tener mejor organizacion en los botones del header
-[FIX]agregar número total de productos vendidos al corte de caja
-[FIX]sitio web de rastreo muestra fecha de entrega un dia antes
-[FIX]ticket #1: fecha actual no se muestra y fecha de entrega ve un dia menos
-[FIX]refactor reportes tab, logic for filters
-[FIX]al agregar gasto, la fecha con que se guarda es un día anterior al seleccionado
-[FIX]validar el cobro final, me deja avanzar de un cobro de 120 nomas poniendo 50 y completa la orden
-[FIX]al momento de cobrar y entregar la orden, en una orden donde se habia dado anticipo, al momento de cobrar viene la opcion de pendiente, no deberia salir pendiente como metodo de pago en ese momento, eso solo deberia salir al crear la orden, pero en este momento ya se finalizo el servicio y el pedido entonces deberiamos recibir el pago total faltante.
-[FIX]icon de la tab del navegador deberia ser el logo2
-[FIX]corregir sidebar ultimo emoji el fondo se corta
-[FIX]corregir texto de ticket de entrega
-[FIX]fecha en 2do ticket
-[FEATURE]abrir cajon automatico al imprimir tickeet y que sea una transferencia en efectivo
-[FEATURE]crear ticket al crear la orden y mandarlo a imprimir, tambien al finalizar la orden
-[FIX]Forzar pago completo para órdenes sin servicios (solo productos) y crearlas directamente como "completados".
-[FIX]orden sin productos-al crear una orden, si solo selecciono productos, deberia de ver un boton cobrar y que haga el flip asi como ahorita pero que el campo elegir fecha no sea requerido, que el campo elegir metodo de pago si sea requerido y que en lugar de ver el boton crear orden, veas el boton cobrar y finalizar, esto porque no es necesario crear una orden si no hay servicios en juego, directamente le vamos a cobrar
-[FEATURE]actualizar mensaje enviado por wapp
    -[x]esperando meta apruebe nuevas plantillas
-[FEATURE]crear /rastrear en .com, pasarle parametro la orderid, y jalar la info desde firebase
    -[x]crear componente rastrear
    -[x]url y token muestran orden del cliente
    -[x]whatsapp envia la plantilla con la url, esto lo armo con el md wapptemplateimplementation
    -[x]se arma la plantilla agregando generando la url dinamica
-[FEATURE]código QR que abra el sitio web
-[FEATURE]tab reportes, actualizar css listo, agregar logica a los elementos
-[FEATURE]agregar logo
-[FEATURE]corte de caja
-[FEATURE]porfa que al entrar en la tab reportes entre preseleccionado el filtro hoy y el boton corte de caja
-[FIX]fotos iphoto
-[FEATURE]utilizar una base de datos limpia para prod
-[FEATURE]conectar el numero real de wapp
-[FIX]factura no se descarga en movil ni ipad
-[FEATURE]al crear una orden, si el cliente no esta registrado, validar con el numero de telefono si esta rgistrado o no, si no esta entonces registralo al crear la orden, y tambien notifica no solo de orden creada si no tambien cliente agregado con exito, en difeentes notificaciones
-[FEATURE]en la orden, guardar factura al generarla
-[FEATURE]agregar campo "administrador", los empleados con este campo activado tendran permisos de admin, validar siempre debe haber al menos un empleado con admin activado, este campo se va usar para validar acciones criticas en la app. solo el admin puede: cancelar o borrar cualquier cosa, solo el admin puede asignar otros admin, solo el admin puede agregar servicio e inventario
-[FEATURE]habilitar metricas de la tab servicios en cada serviceitem
-[EPIC]Agregar pantalla de login, usar credenciales de google, cada empleado debera validar su correo gmail, y solo esas cuentas de empleado seran las que esten habilitadas para iniciar sesión
-[FIX]added photos to history lists from clients tab
-[FIX]subscrisibrse en dashboard a employeslists porque lo remivos de orderdetailview y lo pusimos en orders
-[FEATURE]Fechas disponibles para entrega de acuerdo a la cantidad de ordenes trabajandose en este momento
    -Hacer una formula, como entrada agregar: la suma de ordenes en recibidas + en proceso, tambien el numero de ordenes activas totales, tambien el numero de empleados activos, tambien el numero de ordenes con fecha de entrega hoy, tambien el numero de servicios agrgeados a la orden, tomando en cuenta si son varios items del mismo servicio. esta formula va dar de output una fecha estimada que se mostrara como default como ya ahorita se muestra el campo, solo que asegurarse de usar ahi esa formula.
    -Aun lado de ese campo fecha con la nueva formula, quiero que agregues una pequeña tabla de "proximos 3 días", con tres columnas, digamos si hoy es 27, las columnas deberian ser: mañana, 29, 30. en cada columna pon una fila con el estado y el numero de ordenes, todos los estados por columna porfa, la idea es que esto sea pequeño con la letra esa gris que usas en el header de orderdetailview para mostrar la fecha, asi el usuario se daria una idea de cuantas ordenes estaran en juego en los proximos 3 dias
-[FEATURE]en una orden nueva, cuando toques el input para escribir el nombre del cliente automaticamente desplegar la lista de clientes, ordenada alfabeticamente
-[FEATURE]Asignaciones automaticas de ordenes nuevas
    -criterios para asignación:el empleado activo, con menos ordenes en recibidos + en proceso
    -en una nueva orden, al estar agregando los servicios, los productos...habilitar una nueva sección debajo de productos con los emojis de los empleados, el seleccionado sera el que quede automaticamente asignado a la orden al crearla, aun lado del emoji añade un numero con la suma de las ordenes de recibidos y en proceso, por default selecciona el empleado que tenga menos pero el usuario tendra la libertad de cambiar de empleado
-[FEATURE]fixes iphoto, multiple fixes ux movil related
-[FIX]agregar en orderdetailview, a la foto preview como en empleadoitem
-[FEATURE]Agregar un emoji de una usuario a ordercard cuando la orden ya tenga un autor
-[FEATURE]agregar campo emoji a cada empleado, para asi representar al empleado, como el emoji de servicios y productos
-[FEATURE]agregar en orderdetailview, en los dos autor, que la liste muestre tambien el emoji del empleado
-[FIX]fix notifications colors on mobile
-[FIX]porfa aplica ahora para toda la app el cambio que hicimos al refactorizar algunos componentes del css cuando quitamos los media queries
-[FIX]UX para iphone
-[FIX]se remueve poder hacer zoom con dos dedos en el movil
-[FIX]agregar al header de orderdetailview, la funcion de fecha con hora y el campo autor
-[UX]refactorizar header del orderdetailview para agregar mas detalles de la orden
-[feature/wapp]Al momento de actualizar el estado de una orden a "En entrega" mandar un wapp al cliente de que esta listo su pedido
-[FEATURE]notificacion cuando un cliente responda el mensaje de wapp de orden lista y sonido de mensaje nuevo
-[FEATURE]webhook para wapp, ui para mostrar y recibir wapp en orderdetailview
-[FIX]se remueven 000 ceros del orden number
-[FIX]volver a mostrar el emoji del servicio express en ordercard, y tambien mantener el tag urgente
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