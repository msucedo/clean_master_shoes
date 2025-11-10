# Plan de Implementación: Sistema de Impresión de Tickets

## Contexto

Implementar sistema de impresión de tickets para Clean Master Shoes:
- **PC del local**: Impresora térmica SUZWIP 58mm conectada por USB (con drivers instalados)
- **Móviles**: Impresión vía Share API (compatible con cualquier app de impresión)
- **Tracking**: Registro en Firebase de todas las impresiones

---

## FASE 1: Impresión Manual + Tracking

**Objetivo**: Permitir impresión manual desde botones en OrderDetailView, con registro en Firebase.

**Métodos de impresión**:
- PC: `window.print()` usando drivers del sistema
- Móvil: Web Share API

**Resultado**: Sistema funcional en producción con impresión manual y tracking de impresiones.

---

### Subfase 1.1: Formateadores de Tickets

**Archivos a crear**: `/src/utils/ticketFormatters.js`

**Funciones a implementar**:

#### 1. `formatReceiptTicketHTML(order, businessInfo)` → String HTML
Genera HTML para ticket de recepción (orden recibida).

**Contenido del ticket**:
```
================================
     CLEAN MASTER SHOES
       Tel: XXX-XXX-XXXX
    Calle Example #123
================================

═══ ORDEN RECIBIDA ═══

Orden #: 00123
Fecha: 07/11/2025 10:30 AM
Cliente: Juan Pérez
Tel: XXX-XXX-XXXX

--------------------------------
DETALLE:
• Limpieza profunda x1 .. $150
• Producto ABC x2 ........ $80
--------------------------------

Subtotal: .............. $230.00
TOTAL: ................. $230.00
Anticipo pagado: ....... $100.00
SALDO PENDIENTE: ....... $130.00

--------------------------------
Fecha entrega estimada:
10/11/2025

Gracias por su confianza
================================
```

**Requisitos técnicos**:
- HTML completo con `<!DOCTYPE html>`, `<head>`, `<body>`
- Estilos CSS inline en `<style>` tag
- `@page { margin: 0; size: 58mm auto; }`
- `body { width: 58mm; font-family: monospace; font-size: 10pt; }`
- Clases: `.center`, `.bold`, `.large`, `.line`
- `@media print` para ocultar elementos no necesarios

**Datos a usar del objeto `order`**:
- `orderNumber` (string con padding 5 dígitos)
- `createdAt` (timestamp ISO)
- `client` (nombre)
- `phone` (teléfono)
- `services` (array) - Si existe y tiene items, mostrar
- `products` (array) - Si existe y tiene items, mostrar
- `shoePairs` (array) - Si existe y tiene items, mostrar
- `otherItems` (array) - Si existe y tiene items, mostrar
- `totalPrice`
- `advancePayment`
- `deliveryDate`

**Datos de `businessInfo`**:
- `businessName`
- `phone`
- `address`

**Manejo de items:**
- El ticket debe mostrar TODOS los tipos de items que existan en la orden
- Cada tipo tiene estructura diferente:
  * `services`: `{ serviceName, price, quantity }`
  * `products`: `{ name, salePrice, quantity }`
  * `shoePairs`: `{ model, service, quantity, price }`
  * `otherItems`: `{ description, quantity, price }`
- Si un array está vacío o no existe, no mostrar esa sección
- Formato sugerido en el ticket:
  ```
  DETALLE:
  • Limpieza profunda x1 .. $150  (de services)
  • Producto ABC x2 ........ $80  (de products)
  • Nike Air - Limpieza x1 . $100  (de shoePairs)
  • Item personalizado x1 ... $50  (de otherItems)
  ```

---

#### 2. `formatDeliveryTicketHTML(order, businessInfo)` → String HTML
Genera HTML para comprobante de entrega (orden completada).

**Contenido del ticket**:
```
================================
     CLEAN MASTER SHOES
       Tel: XXX-XXX-XXXX
================================

═══ COMPROBANTE DE ENTREGA ═══

Orden #: 00123
Fecha entrega: 10/11/2025 3:45 PM
Cliente: Juan Pérez

--------------------------------
Total orden: ............. $230.00
Anticipo previo: ......... $100.00
Pago en entrega: ......... $130.00
Método: Efectivo
--------------------------------

✓ ORDEN COMPLETADA

¡Gracias por su preferencia!
¡Esperamos verle pronto!
================================
```

**Datos adicionales a usar**:
- `completedDate` (timestamp ISO)
- `paymentMethod` (cash, card, etc.)
- Calcular pago final: `totalPrice - advancePayment`

---

#### 3. `formatReceiptTicketText(order, businessInfo)` → String
Versión en texto plano del ticket de recepción para Share API en móviles.
- Mismo contenido que HTML pero sin tags
- Usar caracteres ASCII para líneas (=, -, etc.)
- Ancho fijo de 32 caracteres
- Alineación con espacios

---

#### 4. `formatDeliveryTicketText(order, businessInfo)` → String
Versión en texto plano del comprobante de entrega.

---

#### 5. Helper: `formatDate(isoString)` → String
Formatear fecha ISO a formato legible: `DD/MM/YYYY HH:mm AM/PM`

---

#### 6. Helper: `formatCurrency(number)` → String
Formatear número a moneda: `$XXX.XX`

---

**Estimación**: 2.5 horas

**Testing**: Crear datos mock de orden y businessInfo, llamar funciones y verificar output.

**Checklist Subfase 1.1:**
- [ ] Archivo `/src/utils/ticketFormatters.js` creado
- [ ] Función `formatReceiptTicketHTML()` implementada
- [ ] Función `formatDeliveryTicketHTML()` implementada
- [ ] Función `formatReceiptTicketText()` implementada
- [ ] Función `formatDeliveryTicketText()` implementada
- [ ] Helper `formatDate()` implementado
- [ ] Helper `formatCurrency()` implementado
- [ ] Todos los tipos de items se muestran (services, products, shoePairs, otherItems)
- [ ] Manejo de arrays vacíos/undefined
- [ ] HTML válido y CSS inline correcto
- [ ] Ancho de 58mm respetado
- [ ] Tests con datos mock exitosos
- [ ] Sin errores en consola

---

### Subfase 1.2: Servicio de Impresión

**Archivos a crear**: `/src/services/printService.js`

**Importaciones necesarias**:
```javascript
import { getBusinessProfile } from './firebaseService'
import {
  formatReceiptTicketHTML,
  formatDeliveryTicketHTML,
  formatReceiptTicketText,
  formatDeliveryTicketText
} from '../utils/ticketFormatters'
```

**Funciones a implementar**:

#### 1. `detectPlatform()` → Object
```javascript
{
  isMobile: boolean,
  hasShareAPI: boolean,
  userAgent: string
}
```

Detectar:
- `isMobile`: `/iPhone|iPad|Android/i.test(navigator.userAgent)`
- `hasShareAPI`: `'share' in navigator`
- `userAgent`: `navigator.userAgent`

---

#### 2. `printTicketDesktop(order, businessInfo, ticketType)` → Promise
Imprimir ticket en desktop usando `window.print()`.

**Pasos**:
1. Generar HTML según `ticketType` ('receipt' o 'delivery')
2. Crear ventana oculta: `window.open('', '_blank', 'width=302,height=500')`
3. Escribir HTML: `printWindow.document.write(html)`
4. Cerrar documento: `printWindow.document.close()`
5. Esperar carga: `printWindow.onload`
6. Llamar `printWindow.print()`
7. Cerrar ventana después de imprimir: `printWindow.close()`

**Retornar**: `{ success: true, method: 'desktop' }`

---

#### 3. `printTicketMobile(order, businessInfo, ticketType)` → Promise
Imprimir ticket en móvil usando Share API.

**Pasos**:
1. Generar texto según `ticketType`
2. Llamar `navigator.share({ title, text })`
3. Manejar promesa (usuario puede cancelar)

**Retornar**:
- `{ success: true, method: 'mobile' }` si usuario comparte
- `{ success: false, cancelled: true }` si usuario cancela

---

#### 4. `printTicket(order, ticketType)` → Promise (FUNCIÓN PRINCIPAL)
Función inteligente que decide qué método usar.

**Pasos**:
1. Obtener `businessInfo` desde Firebase: `getBusinessProfile()`
2. Detectar plataforma: `detectPlatform()`
3. Decidir método:
   - Si móvil Y hasShareAPI → `printTicketMobile()`
   - Si desktop → `printTicketDesktop()`
   - Si no hay Share API en móvil → Lanzar error con mensaje
4. Retornar resultado

**Retornar**:
```javascript
{
  success: boolean,
  method: 'desktop' | 'mobile',
  cancelled?: boolean,
  error?: string
}
```

---

**Estimación**: 1.5 horas

**Testing**:
- Simular en desktop (debería llamar window.print)
- Simular en móvil (debería llamar Share API)

**Checklist Subfase 1.2:**
- [ ] Archivo `/src/services/printService.js` creado
- [ ] Importaciones correctas agregadas
- [ ] Función `detectPlatform()` implementada
- [ ] Función `printTicketDesktop()` implementada
- [ ] Función `printTicketMobile()` implementada
- [ ] Función principal `printTicket()` implementada
- [ ] Manejo de errores correcto
- [ ] Tests en desktop funcionando
- [ ] Tests en móvil funcionando (Share API)
- [ ] Sin errores en consola

---

### Subfase 1.3: Integración con Firebase

**Archivos a modificar**: `/src/services/firebaseService.js`

**Modelo de datos a agregar**:

```javascript
// Agregar a modelo de orden en Firestore
printHistory: [{
  type: 'receipt' | 'delivery',
  printedAt: string,  // ISO timestamp
  printedBy: 'manual',
  deviceInfo: string  // e.g., "Desktop Chrome 120" o "iPhone Safari"
}]
```

---

#### 1. `addPrintRecord(orderId, printData)` → Promise
Agregar registro de impresión al historial de la orden.

**Parámetros**:
```javascript
printData = {
  type: 'receipt' | 'delivery',
  printedAt: string,
  printedBy: 'manual',
  deviceInfo: string
}
```

**Implementación**:
```javascript
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'

export const addPrintRecord = async (orderId, printData) => {
  try {
    const orderRef = doc(db, 'orders', orderId)
    await updateDoc(orderRef, {
      printHistory: arrayUnion(printData)
    })
    return { success: true }
  } catch (error) {
    console.error('Error adding print record:', error)
    return { success: false, error: error.message }
  }
}
```

---

#### 2. `hasPrintRecord(order, type)` → Boolean
Helper para verificar si ya existe un registro de impresión de cierto tipo.

**Implementación**:
```javascript
export const hasPrintRecord = (order, type) => {
  if (!order.printHistory || order.printHistory.length === 0) {
    return false
  }
  return order.printHistory.some(record => record.type === type)
}
```

---

#### 3. `getPrintRecords(order, type)` → Array
Obtener todos los registros de un tipo específico.

**Implementación**:
```javascript
export const getPrintRecords = (order, type) => {
  if (!order.printHistory) return []
  return order.printHistory.filter(record => record.type === type)
}
```

---

**Estimación**: 1 hora

**Testing**:
- Crear orden de prueba
- Llamar `addPrintRecord()` varias veces
- Verificar en Firestore que se agregó el array
- Probar helpers

**Checklist Subfase 1.3:**
- [ ] Función `addPrintRecord()` agregada a firebaseService.js
- [ ] Función `hasPrintRecord()` agregada
- [ ] Función `getPrintRecords()` agregada
- [ ] Imports de Firestore correctos
- [ ] Tests con orden real exitosos
- [ ] Verificado en Firestore que se crea array `printHistory`
- [ ] arrayUnion funciona correctamente
- [ ] Sin errores en consola

---

### Subfase 1.4: Botones de Impresión en UI

**Archivos a modificar**: `/src/components/OrderDetailView.jsx`

**Ubicación**: En la sección de acciones del modal (donde están botones de WhatsApp, etc.)

---

#### Cambios a implementar:

**1. Imports necesarios**:
```javascript
import { useState } from 'react'
import { printTicket } from '../services/printService'
import { addPrintRecord, hasPrintRecord } from '../services/firebaseService'
import { useNotification } from '../contexts/NotificationContext'
```

**2. Estado local**:
```javascript
const [isPrinting, setIsPrinting] = useState(false)
```

**3. Función `handlePrint(type)`**:
```javascript
const handlePrint = async (type) => {
  setIsPrinting(true)
  try {
    // Imprimir
    const result = await printTicket(order, type)

    if (!result.success) {
      if (result.cancelled) {
        showInfo('Impresión cancelada')
      } else {
        showError(result.error || 'Error al imprimir')
      }
      return
    }

    // Registrar en Firebase
    const printData = {
      type,
      printedAt: new Date().toISOString(),
      printedBy: 'manual',
      deviceInfo: result.method === 'desktop' ? 'Desktop' : 'Mobile'
    }

    const recordResult = await addPrintRecord(order.id, printData)

    if (recordResult.success) {
      showSuccess(`Ticket ${type === 'receipt' ? 'de recepción' : 'de entrega'} impreso`)
      // Opcional: refrescar orden para ver printHistory actualizado
    }
  } catch (error) {
    showError('Error al imprimir: ' + error.message)
  } finally {
    setIsPrinting(false)
  }
}
```

**4. Botones en JSX** (agregar en sección de acciones):
```jsx
{/* Botón imprimir recibo */}
<button
  onClick={() => handlePrint('receipt')}
  disabled={isPrinting}
  className="action-button"
>
  🖨️ Imprimir Recibo
  {hasPrintRecord(order, 'receipt') && <span className="printed-badge">✓</span>}
</button>

{/* Botón imprimir comprobante - solo si orden completada */}
{(order.orderStatus === 'completados' || order.orderStatus === 'enEntrega') && (
  <button
    onClick={() => handlePrint('delivery')}
    disabled={isPrinting}
    className="action-button"
  >
    🖨️ Imprimir Comprobante
    {hasPrintRecord(order, 'delivery') && <span className="printed-badge">✓</span>}
  </button>
)}
```

**5. Estilos CSS** (agregar en archivo CSS correspondiente):
```css
.printed-badge {
  margin-left: 5px;
  color: #4caf50;
  font-weight: bold;
}
```

---

**Estimación**: 1.5 horas

**Testing**:
- Click en botones
- Verificar que abre window.print() en desktop
- Verificar que abre Share API en móvil
- Verificar badge "✓" aparece después de imprimir

**Checklist Subfase 1.4:**
- [ ] Imports agregados a OrderDetailView.jsx
- [ ] Estado `isPrinting` agregado
- [ ] Función `handlePrint()` implementada
- [ ] Botón "Imprimir Recibo" agregado
- [ ] Botón "Imprimir Comprobante" agregado (condicional)
- [ ] Estilos CSS `.printed-badge` agregados
- [ ] Badge "✓" aparece cuando ya se imprimió
- [ ] Notificaciones funcionan correctamente
- [ ] Tests en desktop exitosos
- [ ] Tests en móvil exitosos
- [ ] Firebase actualiza printHistory
- [ ] Sin errores en consola

---

### Subfase 1.5: Sección Informativa en Settings

**Archivos a modificar**: `/src/pages/Settings.jsx`

**Contenido a agregar**:

```jsx
{/* Nueva sección */}
<div className="settings-section">
  <h2>Impresión de Tickets</h2>

  <div className="info-box">
    <h3>ℹ️ Configuración de Impresora</h3>

    <div className="info-item">
      <strong>En Computadora (PC/Mac):</strong>
      <ul>
        <li>Descarga e instala los drivers de tu impresora SUZWIP desde el sitio web del fabricante</li>
        <li>Conecta la impresora por USB</li>
        <li>Configúrala como impresora predeterminada en tu sistema</li>
        <li>Los tickets se imprimirán usando el diálogo de impresión del navegador</li>
      </ul>
    </div>

    <div className="info-item">
      <strong>En Dispositivos Móviles:</strong>
      <ul>
        <li>Descarga una app de impresión Bluetooth desde la App Store o Play Store</li>
        <li>Empareja tu impresora con tu dispositivo móvil</li>
        <li>Al imprimir, selecciona "Compartir" y elige tu app de impresión</li>
      </ul>
    </div>

    <div className="info-item">
      <strong>Cómo imprimir:</strong>
      <p>Abre cualquier orden y usa los botones "🖨️ Imprimir Recibo" o "🖨️ Imprimir Comprobante"</p>
    </div>
  </div>

  <div className="feature-badge">
    <span className="badge-coming-soon">Próximamente: Impresión automática</span>
  </div>
</div>
```

**Estilos CSS a agregar**:
```css
.info-box {
  background-color: #f5f5f5;
  border-left: 4px solid #2196f3;
  padding: 15px;
  margin: 15px 0;
  border-radius: 4px;
}

.info-item {
  margin-bottom: 15px;
}

.info-item strong {
  color: #333;
  display: block;
  margin-bottom: 8px;
}

.info-item ul {
  margin: 5px 0 0 20px;
}

.info-item li {
  margin-bottom: 5px;
  color: #666;
}

.feature-badge {
  text-align: center;
  margin-top: 20px;
}

.badge-coming-soon {
  background-color: #ff9800;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9em;
}
```

---

**Estimación**: 0.5 horas

**Testing**: Verificar que se ve bien en desktop y móvil.

**Checklist Subfase 1.5:**
- [ ] Sección "Impresión de Tickets" agregada a Settings.jsx
- [ ] Contenido HTML correcto
- [ ] Estilos CSS agregados
- [ ] Info para PC visible y clara
- [ ] Info para móviles visible y clara
- [ ] Badge "Próximamente" visible
- [ ] Responsive en desktop
- [ ] Responsive en móvil
- [ ] Sin errores en consola

---

### Resumen Fase 1

**Archivos creados**: 2
- `/src/utils/ticketFormatters.js`
- `/src/services/printService.js`

**Archivos modificados**: 3
- `/src/services/firebaseService.js`
- `/src/components/OrderDetailView.jsx`
- `/src/pages/Settings.jsx`

**Tiempo total estimado**: ~7 horas

**Funcionalidad**:
✅ Impresión manual desde botones
✅ Desktop: window.print() con drivers
✅ Móvil: Share API
✅ Registro en Firebase (printHistory)
✅ Indicadores visuales de impresión
✅ Información para usuarios en Settings

**Listo para producción**: SÍ

---

## FASE 2: Impresión Automática

**Objetivo**: Impresión automática en PC del local al detectar cambios en Firebase.

**Prerequisito**: Fase 1 funcionando en producción.

---

### Archivos a crear:

**1. Servicio Web USB** (`/src/services/usbPrinterService.js`)
- `isUSBAvailable()` - Verificar soporte Web USB API
- `requestUSBPrinter()` - Mostrar diálogo conectar impresora
- `connectToSavedPrinter()` - Reconectar automáticamente
- `disconnectPrinter()` - Desconectar
- `isConnected()` - Verificar estado
- `sendESCPOS(commands)` - Enviar comandos a impresora
- `printTicket(escposData)` - Imprimir ticket
- Guardar referencia en localStorage

**2. Comandos ESC/POS** (`/src/utils/escposCommands.js`)
- Comandos para impresora térmica 58mm
- ESC.INIT, ESC.ALIGN_CENTER, ESC.TEXT_BOLD, etc.
- Helpers: `textToBytes()`, `createLine()`

**3. Hook de listener** (`/src/hooks/usePrinterListener.js`)
- Escuchar cambios en Firebase (`subscribeToOrders`)
- Detectar nueva orden en "recibidos" → Imprimir recibo
- Detectar orden → "completados" → Imprimir comprobante
- Verificar `printHistory` para evitar duplicados
- Impresión silenciosa (sin notificaciones)

---

### Archivos a modificar:

**1. ticketFormatters.js**
- Agregar: `formatReceiptTicketESCPOS(order, businessInfo)` → Bytes
- Agregar: `formatDeliveryTicketESCPOS(order, businessInfo)` → Bytes

**2. printService.js**
- Agregar método para impresión automática vía USB
- Detectar si hay impresora USB conectada
- Usar en lugar de window.print() cuando disponible

**3. App.jsx**
- Importar y ejecutar `usePrinterListener()`

**4. Settings.jsx**
- Sección "Impresora USB"
- Botón "Conectar Impresora USB"
- Estado de conexión
- Botón "Imprimir Prueba"

---

### Funcionalidad Fase 2:

✅ Conexión a impresora USB vía Web USB API
✅ Comandos ESC/POS directos
✅ Impresión automática al detectar cambios
✅ Sin diálogos ni clicks (totalmente automático)
✅ Usa `printHistory` existente para evitar duplicados
✅ Botones manuales siguen funcionando
✅ Configuración en Settings

**Tiempo estimado**: ~6 horas

**Requisito**: PC con Chrome/Edge y impresora USB conectada

---

## Orden de Implementación Sugerido

1. **Ejecutar Fase 1 completa** (subfases 1.1 → 1.5)
2. **Testear en local** (desktop y móvil)
3. **Deploy a producción**
4. **Recolectar feedback** (usar por algunos días)
5. **Ejecutar Fase 2** (cuando esté listo para impresión automática)
6. **Deploy Fase 2 a producción**

---

## Notas Técnicas Importantes

### Para Desktop (window.print):
- Requiere drivers instalados en el sistema operativo
- Usuario debe seleccionar impresora en diálogo
- Funciona en cualquier navegador
- No requiere HTTPS

### Para Móvil (Share API):
- Requiere HTTPS (tu app ya lo tiene con Firebase Hosting)
- Usuario debe tener app de impresión instalada
- Compatible con cualquier app que acepte texto
- Puede fallar en navegadores antiguos

### Para Web USB API (Fase 2):
- Solo Chrome/Edge en desktop
- Requiere HTTPS o localhost
- Primera conexión requiere click del usuario
- Después auto-reconecta
- Envío directo de comandos ESC/POS

### Firebase:
- Campo `printHistory` es array
- Usar `arrayUnion()` para agregar (no sobrescribir)
- Opcional: Usar transacciones si múltiples dispositivos

---

## Datos de Prueba

Usar estos datos mock para testing:

```javascript
const mockOrder = {
  id: 'test123',
  orderNumber: '00123',
  orderStatus: 'recibidos',
  client: 'Juan Pérez',
  phone: '555-1234',
  createdAt: '2025-01-15T10:30:00Z',
  deliveryDate: '2025-01-18T00:00:00Z',
  completedDate: '2025-01-18T15:45:00Z',
  services: [
    { serviceName: 'Limpieza profunda', price: 150, quantity: 1 }
  ],
  products: [
    { name: 'Producto ABC', salePrice: 40, quantity: 2 }
  ],
  totalPrice: 230,
  advancePayment: 100,
  paymentMethod: 'cash',
  printHistory: []
}

const mockBusinessInfo = {
  businessName: 'Clean Master Shoes',
  phone: '555-5678',
  address: 'Calle Example #123, Ciudad'
}
```

---

## Problemas Comunes y Soluciones

### Desktop (window.print)

**Problema**: window.print() no abre el diálogo
- **Solución**: Verificar que los drivers de la impresora estén instalados
- **Solución**: Verificar que la impresora esté conectada y encendida
- **Solución**: Probar con `window.print()` en consola del navegador

**Problema**: El formato se ve mal al imprimir
- **Solución**: Verificar estilos `@page` y `@media print`
- **Solución**: Ajustar `size: 58mm auto` si es necesario
- **Solución**: Verificar que `width: 58mm` esté en el body

**Problema**: Se imprime en otra impresora
- **Solución**: Configurar impresora térmica como predeterminada en sistema
- **Solución**: Seleccionar manualmente en el diálogo de impresión

### Móvil (Share API)

**Problema**: navigator.share() no funciona
- **Solución**: Verificar que la app esté en HTTPS (Firebase Hosting ya lo tiene)
- **Solución**: Verificar que el navegador soporte Share API (Chrome, Safari modernos)
- **Solución**: Verificar en consola: `'share' in navigator`

**Problema**: El usuario cancela y se muestra error
- **Solución**: Manejar el `cancelled: true` en el resultado
- **Solución**: Mostrar mensaje informativo, no error

**Problema**: La app de impresión no aparece en el menú
- **Solución**: Verificar que el usuario tenga una app de impresión instalada
- **Solución**: Recomendar apps: "Print Central", "Brother iPrint&Scan", etc.

### Firebase

**Problema**: printHistory no se guarda en Firestore
- **Solución**: Verificar permisos de Firestore (reglas de seguridad)
- **Solución**: Verificar que el campo `id` de la orden sea correcto
- **Solución**: Revisar consola de Firebase por errores

**Problema**: Se crean duplicados en printHistory
- **Solución**: Verificar que `arrayUnion()` esté siendo usado
- **Solución**: Revisar si múltiples dispositivos están imprimiendo simultáneamente
- **Solución**: Considerar usar transacciones si hay race conditions

**Problema**: El badge "✓" no aparece después de imprimir
- **Solución**: Refrescar el estado de la orden después de guardar
- **Solución**: Verificar que `hasPrintRecord()` esté leyendo correctamente
- **Solución**: Revisar que el componente se re-renderice

### General

**Problema**: Errores en consola de imports
- **Solución**: Verificar rutas relativas (`../services`, `../utils`)
- **Solución**: Verificar que todos los archivos estén creados
- **Solución**: Verificar exports/imports (named vs default)

**Problema**: Funciones no definidas
- **Solución**: Verificar que todas las funciones estén exportadas
- **Solución**: Verificar que los imports coincidan con los exports
- **Solución**: Revisar que no falten dependencias

---

## Checklist Final Fase 1

Antes de hacer deploy a producción:

### Funcionalidad
- [ ] Impresión manual funciona en desktop
- [ ] Impresión manual funciona en móvil
- [ ] printHistory se guarda en Firebase
- [ ] Badge "✓" aparece correctamente
- [ ] Todos los tipos de items se muestran en tickets
- [ ] Formato de tickets es legible en impresora 58mm
- [ ] Notificaciones funcionan correctamente

### Código
- [ ] Todos los archivos creados
- [ ] Todos los imports correctos
- [ ] No hay errores en consola
- [ ] No hay warnings en consola
- [ ] Código comentado donde es necesario
- [ ] Funciones tienen manejo de errores

### Testing
- [ ] Probado con orden con services
- [ ] Probado con orden con products
- [ ] Probado con orden con shoePairs
- [ ] Probado con orden con otherItems
- [ ] Probado con orden con arrays vacíos
- [ ] Probado con orden completada
- [ ] Probado con orden en otros estados
- [ ] Probado en Chrome desktop
- [ ] Probado en Safari móvil
- [ ] Probado con impresora real

### UI/UX
- [ ] Botones visibles en OrderDetailView
- [ ] Sección visible en Settings
- [ ] Responsive en móvil
- [ ] Responsive en desktop
- [ ] Textos claros y sin typos
- [ ] Feedback visual apropiado

### Firebase
- [ ] Reglas de seguridad permiten actualizar printHistory
- [ ] Estructura de datos correcta
- [ ] Queries funcionan correctamente

### Documentación
- [ ] Instrucciones para usuarios en Settings
- [ ] Comentarios en código complejo
- [ ] README actualizado (opcional)

---

**Documento creado**: 2025-01-07
**Última actualización**: 2025-01-07
**Proyecto**: Clean Master Shoes - Sistema de Impresión de Tickets
**Versión**: 1.1
