Clean master shoes

// WIP
- dejar tarjetas con un minimo de altura para que no se hagan chicas, editar que ver y width

// PRIORIDAD ALTA
- [UX]ipad, en modo vertical, alinear los iconos del menu izquierdo centrados, porque estan los iconos hacia la derecha en el cuadrito que los rodea

// PRIORIDAD MEDIA
- fix: en el header, centrar el icono de la lupa, en el recuadro que lo rodea
- [VAL]En las tarjetas, si la fecha de entrega es mañana, hoy o ayer, ponerle colores, asi como ya esta ahorita pero creo sin logica solo como mockup
- [VAL]La fecha de entrega no debe ser anterior a hoy

// PRIORIDAD BAJA
- nueva funcionalidad: calcula la fecha de entrega de acuerdo a el total de numeros de tenis y los servicios a completar
- nueva funcionalidad: en la pantalla detalle de orden, en la parte de informacion de pago, agregar un desglose antes del total, para saber que items lograron ese costo total por favor y tambien asegurate de agregar el impuesto acorde a mexico
- nueva funcionalidad: en la tab clientes, los botones del filtro hacerlos mas amigables para el usuario UX
- nueva funcionalidad: no poder actualizar a listo el estado de la orden hasta que todos los items de la orden tengan el estado en completado


// FIXES


// EPICS
- [EPIC]nueva funcionalidad: aparte de tenis, poder aceptar ordenes de gorras y bolsas
- [EPIC]agregar pantalla de login, creacion de usuarios
- [EPIC]actualizar pagina de dashboard

// COMPLETADO
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