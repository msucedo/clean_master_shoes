Clean master shoes

// PRIORIDAD ALTA
- ademas de tenis, tambien a veces los clientes llevan bolsas o gorras u otros items, quiero poder llevar el registro de eso tambien, en el componente orderForm, quiero un nuevo boton, igual al de "agregar otro par de tenis", y que este boton diga "agregar otro tipo de item", al hacer clic va agregar tambien un nuevo item pero el formulario debe pregunar por que tipo de item es
- en el componente orderDetailView, debo poder editar la fecha de entrega de una orden

// PRIORIDAD MEDIA
- fix: acomodar mas aesthetic del header, boton de busqueda y boton de agregar

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
