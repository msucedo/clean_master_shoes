# Guía de Configuración de WhatsApp Business API

Esta guía te ayudará a configurar WhatsApp Business API para enviar notificaciones automáticas a tus clientes cuando sus órdenes estén listas para entrega.

## Requisitos Previos

- Una cuenta de Facebook Business Manager
- Un número de teléfono que NO esté registrado en WhatsApp (será tu número de negocio)
- Acceso a Meta for Developers

## Paso 1: Crear una App en Meta for Developers

1. Ve a [Meta for Developers](https://developers.facebook.com/)
2. Haz clic en **"My Apps"** en el menú superior
3. Clic en **"Create App"**
4. Selecciona el tipo **"Business"**
5. Completa la información:
   - **App Name**: "Clean Master Shoes Notifications" (o el nombre que prefieras)
   - **App Contact Email**: Tu email de contacto
   - **Business Account**: Selecciona o crea tu Business Manager
6. Haz clic en **"Create App"**

## Paso 2: Agregar WhatsApp a tu App

1. En el dashboard de tu app, busca **"WhatsApp"** en la lista de productos
2. Haz clic en **"Set up"** en la tarjeta de WhatsApp
3. Selecciona tu Business Portfolio o crea uno nuevo
4. Acepta los términos y condiciones

## Paso 3: Configurar el Número de Teléfono

### Opción A: Usar el número de prueba (para testing)

Meta te proporciona un número de prueba automáticamente. Este número tiene limitaciones:
- Solo puede enviar mensajes a 5 números verificados
- No es válido para producción

### Opción B: Registrar tu propio número (recomendado para producción)

1. En el panel de WhatsApp, ve a **"WhatsApp" > "Getting Started"**
2. Haz clic en **"Add phone number"**
3. Selecciona el método de verificación:
   - **Mensaje de texto (SMS)**
   - **Llamada telefónica**
4. Ingresa tu número y completa la verificación
5. **IMPORTANTE**: Este número quedará vinculado a WhatsApp Business API y NO podrá usarse en la app regular de WhatsApp

## Paso 4: Obtener tus Credenciales

### Access Token (Token de Acceso)

1. Ve a **"WhatsApp" > "Getting Started"**
2. En la sección **"Temporary access token"**, copia el token
   - ⚠️ Este token es temporal (24-72 horas) y solo para pruebas

**Para producción, necesitas un token permanente:**

1. Ve a **"Tools" > "Graph API Explorer"**
2. Selecciona tu app en el dropdown
3. Genera un token con los permisos necesarios:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
4. Para hacerlo permanente:
   - Ve a **"Business Settings" > "System Users"**
   - Crea un System User
   - Asigna permisos de WhatsApp
   - Genera un token de sistema (no expira)

### Phone Number ID

1. En **"WhatsApp" > "Getting Started"**
2. Busca la sección **"Phone number ID"**
3. Copia el ID (es un número largo, ej: `109876543210987`)

### Business Account ID

1. En **"WhatsApp" > "Getting Started"**
2. Busca **"WhatsApp Business Account ID"**
3. Copia el ID

## Paso 5: Configurar Variables de Entorno

1. Copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Abre `.env` y actualiza las siguientes variables con tus credenciales:

```env
# WhatsApp Business API Configuration
VITE_WHATSAPP_ACCESS_TOKEN=tu_access_token_aqui
VITE_WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id_aqui
VITE_WHATSAPP_BUSINESS_ACCOUNT_ID=tu_business_account_id_aqui
VITE_WHATSAPP_API_VERSION=v21.0

# Business Information
VITE_BUSINESS_NAME=Clean Master Shoes
VITE_BUSINESS_ADDRESS=Tu dirección del negocio aquí

# Habilitar WhatsApp
VITE_WHATSAPP_ENABLED=true
```

3. Guarda el archivo `.env`

## Paso 6: Verificar Números de Prueba (Testing)

Si estás usando el número de prueba, debes verificar los números a los que enviarás mensajes:

1. Ve a **"WhatsApp" > "Getting Started"**
2. En la sección **"To"**, agrega números de teléfono
3. Cada número recibirá un código por WhatsApp
4. Ingresa el código para verificar el número
5. Puedes agregar hasta 5 números

## Paso 7: Probar la Integración

1. Reinicia tu servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Crea una orden de prueba con el número verificado

3. Cambia el estado de la orden a **"En entrega"**

4. Deberías recibir un mensaje de WhatsApp automáticamente

## Paso 8: Mensaje de Plantilla (Opcional - Producción)

Para producción, WhatsApp requiere que uses plantillas de mensajes aprobadas:

1. Ve a **"WhatsApp" > "Message Templates"**
2. Haz clic en **"Create Template"**
3. Diseña tu plantilla:
   - **Nombre**: `order_ready_notification`
   - **Categoría**: `UTILITY`
   - **Idioma**: Español
   - **Contenido**:
     ```
     ¡Hola {{1}}! 👋

     Tu orden #{{2}} está lista para entrega. 🎉

     Servicios listos:
     {{3}}

     Te esperamos en {{4}}

     ¡Gracias por tu preferencia!
     ```
4. Envía para aprobación (puede tardar hasta 24 horas)

## Solución de Problemas

### Error: "Access token invalid"
- Verifica que copiaste el token completo
- Genera un nuevo token si expiró
- Asegúrate de usar un System User token para producción

### Error: "Phone number not verified"
- Si usas el número de prueba, verifica el número destino
- Para producción, completa el proceso de registro del número

### Error: "Message template not found"
- Asegúrate de que la plantilla esté aprobada
- Verifica que el nombre de la plantilla sea correcto

### Los mensajes no se envían
1. Verifica que `VITE_WHATSAPP_ENABLED=true` en `.env`
2. Revisa la consola del navegador para errores
3. Verifica que el número de teléfono del cliente esté en formato correcto

## Límites y Consideraciones

### Límites de Mensajería

- **Número de prueba**: 250 mensajes/24 horas a 5 números verificados
- **Número registrado (Tier 1)**: 1,000 conversaciones únicas/24 horas
- **Tier superior**: Hasta 100,000+ conversaciones (requiere verificación de negocio)

### Costos

- **Primeras 1,000 conversaciones/mes**: GRATIS
- **Conversaciones adicionales**: Varía por país (~$0.005 - $0.03 USD por conversación)
- Una "conversación" incluye múltiples mensajes dentro de 24 horas

### Verificación de Negocio (Meta Business Verification)

Para límites más altos, necesitas verificar tu negocio:
1. Ve a **Business Settings > Security Center**
2. Haz clic en **"Start Verification"**
3. Proporciona documentos oficiales del negocio
4. El proceso puede tardar 1-5 días laborales

## Recursos Adicionales

- [Documentación oficial de WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [WhatsApp Cloud API Quick Start](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [Message Templates Guide](https://developers.facebook.com/docs/whatsapp/message-templates)
- [API Reference](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages)

## Soporte

Si tienes problemas con la configuración:
1. Revisa la documentación oficial de Meta
2. Verifica los logs en la consola del navegador
3. Contacta al equipo de soporte de Meta for Developers

---

**Última actualización**: Enero 2025
