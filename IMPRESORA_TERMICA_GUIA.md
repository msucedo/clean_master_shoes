# Guía de Impresión Térmica - Clean Master Shoes

## 📋 Resumen de la Implementación

Se ha implementado un **sistema completo de impresión térmica** que funciona en múltiples plataformas usando comandos ESC/POS nativos según el manual de tu impresora 58mm.

### ✅ Características Implementadas

1. **Impresión ESC/POS Nativa**
   - Comandos basados en el manual del programador de impresoras 58mm
   - Compatible con comandos estándar ESC/POS
   - Optimizado para ancho de papel de 58mm

2. **Códigos QR en Tickets**
   - Comando `ESC Z` nativo de la impresora
   - QR apunta a tu sitio web
   - Nivel de corrección de errores: M (15%)
   - Tamaño de módulo: 6 (ajustable)

3. **Soporte Multi-Plataforma**
   - ✅ **Desktop**: window.print() con HTML (funciona perfecto)
   - ✅ **Android Chrome/PWA**: Web Bluetooth API + ESC/POS
   - ✅ **iOS Safari**: Share API (fallback a texto)
   - ✅ **Detección automática** de la mejor opción

4. **Reconexión Automática**
   - Guarda la impresora preferida en localStorage
   - Reconecta automáticamente al imprimir
   - Panel de configuración en Settings

5. **Fallback Inteligente**
   - Si falla Bluetooth → intenta Share API
   - Siempre hay una forma de compartir el ticket

---

## 🏗️ Arquitectura del Sistema

### Archivos Creados

```
src/
├── utils/
│   ├── escposCommands.js          ← Generador de comandos ESC/POS
│   └── ticketFormatters.js        ← Formateadores (HTML + ESC/POS)
├── services/
│   ├── bluetoothPrinterService.js ← Conexión Bluetooth
│   └── printService.js            ← Lógica multi-plataforma
└── components/
    ├── PrinterSettings.jsx        ← UI configuración
    └── PrinterSettings.css        ← Estilos
```

### Flujo de Impresión

```
Usuario hace clic en "Imprimir"
           ↓
    detectPlatform()
           ↓
    ┌──────┴──────┐
    │  Desktop?   │ → window.print() (HTML)
    └──────┬──────┘
           │ No
    ┌──────┴──────┐
    │  Android +  │ → Bluetooth ESC/POS
    │  Bluetooth? │
    └──────┬──────┘
           │ No
    ┌──────┴──────┐
    │    iOS?     │ → Share API (texto)
    └─────────────┘
```

---

## 🧪 Cómo Probar

### 1. En Android (Bluetooth)

1. Abre la app en **Chrome para Android**
2. Ve a **Settings** (Configuración)
3. En la sección "Configuración de Impresora Bluetooth":
   - Click en "📱 Conectar Impresora"
   - Selecciona tu impresora 58mm de la lista
   - Click en "🧪 Imprimir Prueba"

4. Abre una orden cualquiera
5. Click en "🖨️ Imprimir Recibo"
6. **Debería imprimir automáticamente** con formato ESC/POS

### 2. En Desktop

1. Abre en **Chrome/Edge** en computadora
2. La impresión usará `window.print()` (como antes)
3. Funciona perfecto sin cambios

### 3. En iOS

1. Abre en Safari (iPhone/iPad)
2. Al imprimir, se abrirá el **diálogo de compartir**
3. Puedes enviar por WhatsApp, Email, etc.
4. **Limitación**: iOS no soporta Web Bluetooth

---

## 📝 Comandos ESC/POS Implementados

Basados en el **manual del programador 58mm**:

| Comando | Código | Función |
|---------|--------|---------|
| `ESC @` | 1B 40 | Inicializar impresora |
| `ESC a n` | 1B 61 n | Alineación (0=izq, 1=centro, 2=der) |
| `GS ! n` | 1D 21 n | Tamaño de texto |
| `ESC E n` | 1B 45 n | Negrita |
| `ESC - n` | 1B 2D n | Subrayado |
| `ESC Z m n k ...` | 1B 5A ... | Código QR |
| `GS V m n` | 1D 56 42 n | Corte de papel |
| `LF` | 0A | Salto de línea |

---

## 🔧 Ajustes y Configuración

### Cambiar URL del QR

En `src/utils/ticketFormatters.js` línea ~526 y ~629:

```javascript
const websiteUrl = businessInfo.website || 'https://cleanmastershoes.com';
```

Cambia la URL por la de tu sitio web.

### Ajustar Ancho del Ticket

El ancho está configurado para **48 caracteres** (Font A 12×24).

Para cambiar, edita en `src/utils/escposCommands.js`:

```javascript
hr(char = '-', width = 48)  // ← Cambiar este 48
tableRow(left, right, width = 48)  // ← Y este
```

### Cambiar Tamaño del QR

En los formateadores ESC/POS:

```javascript
.qrCode(websiteUrl, 1, 6)
//                    │  └─ Tamaño (1-8)
//                    └─ Corrección de errores (0-3)
```

- **Error correction**: 0=L(7%), 1=M(15%), 2=Q(25%), 3=H(30%)
- **Module size**: 1-8 (6 es un buen tamaño)

---

## 🐛 Solución de Problemas

### El QR no se imprime

**Verificar comando en el manual:**
- Revisa la página 25 del manual del programador
- El comando es: `ESC Z m n k dL dH d1...dn`
- Si tu impresora no soporta este comando, puedes:
  1. Usar librería `qrcode` para generar imagen rasterizada
  2. Enviarla como bitmap con `ESC * m nL nH d1...dk`

**Solución alternativa (si el comando QR falla):**

```javascript
import QRCode from 'qrcode';

// Generar QR como imagen
const qrDataUrl = await QRCode.toDataURL(websiteUrl, {
  width: 200,
  margin: 1
});

// Convertir a bitmap y enviar con ESC *
// (requiere más implementación)
```

### La impresora no se conecta

1. **Verificar Bluetooth**:
   - Impresora encendida
   - Bluetooth del dispositivo activado
   - Impresora visible (modo emparejamiento)

2. **Chrome flags** (Android):
   - Ve a `chrome://flags`
   - Busca "Web Bluetooth"
   - Asegúrate que esté **Enabled**

3. **Permisos**:
   - Android puede pedir permisos de ubicación
   - Acepta todos los permisos

### El formato se ve mal

**Ajustar espaciado:**

```javascript
// En escposCommands.js
lineSpacing(n = 30)  // ← Cambiar espaciado (unidades de 0.125mm)
```

**Ajustar ancho de columnas:**

```javascript
// En ticketFormatters.js
cmd.tableRow(`${name} x${qty}`, price, 48);
//                                      └─ Ancho total
```

### Texto cortado o muy largo

```javascript
// Usar wrapText para textos largos
import { wrapText } from '../utils/escposCommands';

const lines = wrapText(longText, 48);
lines.forEach(line => cmd.text(line).feed());
```

---

## 📱 Limitaciones por Plataforma

| Plataforma | Bluetooth | HTML Print | Share |
|------------|-----------|------------|-------|
| Android Chrome | ✅ Sí | ✅ Sí | ✅ Sí |
| Android WebView | ✅ Sí | ⚠️ Limitado | ✅ Sí |
| iOS Safari | ❌ No | ⚠️ Limitado | ✅ Sí |
| Desktop Chrome | ✅ Sí | ✅ Sí | ❌ No |
| Desktop Edge | ✅ Sí | ✅ Sí | ❌ No |
| Desktop Firefox | ❌ No | ✅ Sí | ❌ No |

**Recomendación**: Usa **Chrome en Android** para mejor experiencia con Bluetooth.

---

## 🚀 Próximos Pasos

### Testing Real

1. **Conecta tu impresora 58mm**
2. **Prueba en Android**:
   ```bash
   npm run dev:mobile
   ```
3. **Imprime un ticket de prueba**
4. **Ajusta formatos** según resultado

### Posibles Mejoras

- [ ] Agregar más comandos ESC/POS (imágenes, códigos de barras)
- [ ] Soporte para impresoras 80mm
- [ ] Configuración de templates de tickets
- [ ] Auto-impresión al completar orden
- [ ] Múltiples impresoras guardadas

---

## 📚 Referencias

- **Manual del Programador**: `58MM Printer Programmer Manual.pdf`
- **Manual de Usuario**: `58MM Printer User Instruction Manual.pdf`
- **Web Bluetooth API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API
- **ESC/POS Commands**: Estándar Epson ESC/POS

---

## 💬 Soporte

Si tienes problemas:

1. Revisa la consola del navegador (F12)
2. Verifica que los comandos coincidan con tu modelo de impresora
3. Prueba el "🧪 Imprimir Prueba" en Settings
4. Ajusta los parámetros según tu impresora específica

---

## ✨ Créditos

Sistema implementado según especificaciones del **58MM Thermal Printer Programming Manual**, compatible con comandos ESC/POS estándar.

**Fecha de implementación**: ${new Date().toLocaleDateString('es-MX')}
**Versión**: 1.0.0
