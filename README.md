Clean master shoes

// WIP


// PRIORIDAD ALTA

// PRIORIDAD MEDIA
- [FIX]Fecha de entrega por default que sea 2 dias, pero que en la orden siga pudiendo ser editable


// PRIORIDAD BAJA
- [EPIC]Al momento de actualizar el estado de una orden a "En entrega" mandar un wapp al cliente de que esta listo su pedido
- [FEATURE]si una orden esta retrasada que aparezca "retrasada" en la orden component

// BACKLOG
-[FIX]de orderform, remover el campo de la UI "prioridad", por defecto a todas las ordenes ponles la prioridad de normal, cuando una orden tenga el producto express, entonces automaticamente a prioridad ponle el valor express
- [FEATURE]Habilitar opcion de descuento en la paymentscreen
- [FEATURE]Filtros para ordenes - Agregar filtro de mas recientes, mas antiguas, con mas serviciios, en la tab ordenes para todas las columnas
- [FEATURE]Seleccionar multiples ordenes a la vez - la etiqueta de fecha de la orden, si la presionas, deberia animarse con un flip y que se llene el background del mismo color pero solido, y en ese momento esa orden queda seleccionada, despues si abro otra orden diferente, y le cambio el estado a esa 2da orden, entonces como la primera estaba seleccionada entonces tambien a esa primera se le asigna el mismo estado, asi podemos mover mas de una orden a la vez entre estados
- [EPIC]Pantalla promociones
- [EPIC]Agregar pantalla de login, creacion de usuarios
- [VAL]Si una orden lleva el servicio express especificarlo en la tarjeta
- [FIX]Habilitar nueva orden en iphone, ux no se ve
-[VAL]Pantalla de pago, validar este todo correcto con jhnonyy
-[FIX]orden sin productos-al crear una orden, si solo selecciono productos, deberia de ver un boton cobrar y que haga el flip asi como ahorita pero que el campo elegir fecha no sea requerido, que el campo elegir metodo de pago si sea requerido y que en lugar de ver el boton crear orden, veas el boton cobrar y finalizar, esto porque no es necesario crear una orden si no hay servicios en juego, directamente le vamos a cobrar
    -[FIX]En el dashbaord validar "ingresos hoy" tambien aumente con ordenes de solo productos
-[FIX]no poder agendar ordenes con fechas pasadas, si ya se venció la fecha y la orden sigue abierta pintar de rojo toda la tarjeta
-[FIX]remover el tax de la pantalla de pagos

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
- membresia claude code