# Configuración de Webhook de WhatsApp

Esta guía te ayudará a configurar el webhook para recibir respuestas de WhatsApp en tu aplicación.

## 📋 Requisitos Previos

1. **WhatsApp Business API** configurada (ver `WHATSAPP_SETUP.md`)
2. **App desplegada en Vercel** con dominio público
3. **Firebase Admin SDK** configurado

---

## 🔧 Paso 1: Configurar Variables de Entorno

### 1.1 En Vercel

Ve a tu proyecto en Vercel → Settings → Environment Variables y agrega:

```bash
# Token para verificar el webhook (crea uno único)
VITE_WHATSAPP_WEBHOOK_VERIFY_TOKEN=mi_token_secreto_super_seguro_123

# App Secret de Facebook (para verificar firmas)
VITE_WHATSAPP_APP_SECRET=tu_app_secret_de_meta

# Firebase Service Account (para guardar mensajes en Firestore)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}
```

### 1.2 Obtener Firebase Service Account Key

1. Ve a **Firebase Console** → Settings (⚙️) → **Service accounts**
2. Click en "**Generate new private key**"
3. Se descargará un archivo JSON
4. **Importante**: Minimiza el JSON en una sola línea para la variable de entorno:
   ```bash
   # En terminal, minimiza el JSON:
   cat firebase-service-account.json | jq -c
   ```
5. Copia todo el JSON minimizado y pégalo como valor de `FIREBASE_SERVICE_ACCOUNT_KEY`

### 1.3 Obtener App Secret de Meta

1. Ve a **Meta for Developers** → Tu App
2. En el menú lateral: **Settings** → **Basic**
3. Click en "**Show**" junto a "App Secret"
4. Copia el valor y agrégalo a `VITE_WHATSAPP_APP_SECRET`

---

## 📱 Paso 2: Configurar Webhook en Meta

### 2.1 Acceder a Configuración

1. Ve a **Meta for Developers** → Tu App WhatsApp
2. En el menú lateral: **WhatsApp** → **Configuration**
3. Busca la sección "**Webhook**"

### 2.2 Configurar URL del Webhook

1. Click en "**Edit**" o "**Configure webhooks**"
2. Ingresa la URL de tu webhook:
   ```
   https://tu-dominio.vercel.app/api/whatsapp-webhook
   ```
   **Ejemplo:** `https://clean-master-shoes.vercel.app/api/whatsapp-webhook`

3. Ingresa el **Verify Token** (debe coincidir con `VITE_WHATSAPP_WEBHOOK_VERIFY_TOKEN` en Vercel):
   ```
   mi_token_secreto_super_seguro_123
   ```

4. Click en "**Verify and Save**"

   ✅ Si todo está bien, verás: "Webhook verified successfully"

### 2.3 Suscribirse a Eventos

Después de verificar, en la sección "**Webhook fields**":

1. Activa (toggle ON) los siguientes eventos:
   - ✅ **messages** - Para recibir mensajes del cliente
   - ✅ **message_status** (opcional) - Para saber si fueron entregados/leídos

2. Click en "**Save**"

---

## 🧪 Paso 3: Probar el Webhook

### 3.1 Verificar Logs en Vercel

1. Ve a **Vercel** → Tu proyecto → **Functions**
2. Busca la función `/api/whatsapp-webhook`
3. Haz click para ver los logs en tiempo real

### 3.2 Enviar Mensaje de Prueba

1. **Desde tu app**, cambia una orden a estado "En Entrega" (esto enviará un mensaje al cliente)
2. **Desde tu teléfono** (número asociado a la orden), responde al mensaje
3. **En Vercel Functions**, deberías ver logs como:
   ```
   📥 [Webhook] POST request received
   📨 [Webhook] Payload: {...}
   💬 [Webhook] Incoming message: {...}
   📞 From: 5215512345678
   📝 Message: Gracias, iré mañana!
   🔍 Buscando orden para teléfono: 5215512345678
   ✅ Orden encontrada: abc123 #00025
   ✅ Mensaje guardado en orden: abc123
   ```

4. **En tu app**, ve a OrderDetailView de esa orden
5. En la sección "💬 Conversación WhatsApp" deberías ver:
   - Tu mensaje enviado (a la derecha, verde)
   - La respuesta del cliente (a la izquierda, gris)

---

## 🔍 Troubleshooting

### Error: "Webhook verification failed"

**Causa**: El token no coincide

**Solución**:
1. Verifica que `VITE_WHATSAPP_WEBHOOK_VERIFY_TOKEN` en Vercel sea exactamente igual al que ingresaste en Meta
2. Redeploy la app en Vercel después de cambiar variables
3. Intenta nuevamente en Meta

### Error: "Signature verification failed"

**Causa**: `VITE_WHATSAPP_APP_SECRET` incorrecto o falta

**Solución**:
1. Verifica que el App Secret en Vercel sea correcto (cópialo nuevamente de Meta)
2. Redeploy la app
3. En desarrollo, puedes comentar temporalmente la verificación de firma

### No se reciben mensajes

**Solución**:
1. Verifica en **Vercel Functions** que la función esté desplegada
2. Prueba la URL directamente en el navegador (debería devolver "Method Not Allowed")
3. Verifica que estés suscrito al evento "**messages**" en Meta
4. Revisa los logs de Vercel Functions en tiempo real

### Mensajes no aparecen en OrderDetailView

**Solución**:
1. Verifica en **Firebase Console** → Firestore que la orden tenga el array `whatsappNotifications` actualizado
2. Verifica que el número de teléfono de la orden coincida con el que está respondiendo
3. Revisa los logs en Vercel para ver si hubo algún error al guardar en Firestore

---

## 📊 Estructura de Datos

Los mensajes se guardan en Firestore en el campo `whatsappNotifications` de cada orden:

```javascript
{
  // Mensaje enviado por la app
  {
    type: "sent",  // o undefined (legacy)
    direction: "outgoing",
    message: "¡Hola! Tu orden #25 está lista...",
    sentAt: "2025-10-24T10:30:00.000Z",
    status: "sent",
    messageId: "wamid.xxx"
  },

  // Respuesta del cliente
  {
    type: "received",
    direction: "incoming",
    from: "5215512345678",
    message: "Gracias, iré mañana!",
    messageId: "wamid.yyy",
    timestamp: "2025-10-24T10:35:00.000Z",
    receivedAt: "2025-10-24T10:35:05.000Z"
  }
}
```

---

## 🔐 Seguridad

**IMPORTANTE**: Las variables `VITE_WHATSAPP_APP_SECRET` y `FIREBASE_SERVICE_ACCOUNT_KEY` son **secretos**. No las compartas ni las subas a GitHub.

✅ Están seguras en Vercel (solo el backend las ve)
✅ Firebase Admin solo se ejecuta en el servidor (Vercel Functions)
❌ No las pongas en archivos `.env` que se commiteen

---

## 📚 Referencias

- [WhatsApp Business Platform - Webhooks](https://developers.facebook.com/docs/whatsapp/webhooks)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

---

## ✅ Checklist

- [ ] Variables de entorno configuradas en Vercel
- [ ] Firebase Service Account Key generada y agregada
- [ ] Webhook URL configurada en Meta
- [ ] Verify Token coincide entre Meta y Vercel
- [ ] Suscrito a eventos "messages" en Meta
- [ ] Webhook verificado exitosamente
- [ ] Prueba enviada y respuesta recibida
- [ ] Respuesta visible en OrderDetailView

¡Listo! Tu sistema ahora puede recibir y mostrar respuestas de WhatsApp. 🎉
