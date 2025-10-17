Clean master shoes

// WIP
- [FEATURE]En la tab ordenes, agregar una 4ta columna "En entrega"


// PRIORIDAD ALTA
- [FIX]En lugar que en la columna "listos" aparezca el boton de cobrar y de entregar en los detalles de la orden, mejor quiero que eso salga en la nueva 4ta columna "En entrega", tambien cambia la validacion que no deja avanzar a "listos" hasta completar todos los items por no dejar avanzar a la nueva 4ta columna "En entrega"
- Tomar una EPIC

// PRIORIDAD MEDIA
- [FIX]Fecha de entrega por default que sea 2 dias, pero que en la orden siga pudiendo ser editable
- [FEATURE]Agregar campo autor a cada orden

// PRIORIDAD BAJA
- [FEATURE]Al momento de actualizar el estado de una orden a "En entrega" mandar un wapp al cliente de que esta listo su pedido

// EPICS
- [EPIC]Tab servicios, Agregar funcionalidad al boton de agregar servicio, remover data de prueba y establer servicios verdaderos
- [EPIC]Refactorizar tarjeta de orden, unificar servicios y listas de items, crear nueva ux
- [EPIC]Refactorizar dashboard, asegurarse que la primer sección funcione, y en la 2da mejor poner las tarjetas de la 4ta columna "En entrega"
- [EPIC]Pantalla empleado
- [EPIC]Pantalla catalogo
- [EPIC]Pantalla promociones
- [EPIC]Agregar pantalla de login, creacion de usuarios

// COMPLETADO
- [UX]Nuevas tab para el sidebar: empleados, catalogo y promociones
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