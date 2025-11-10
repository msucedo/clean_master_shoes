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

# WhatsApp Template Configuration (Opcional - para mensajes en cualquier momento)
VITE_WHATSAPP_TEMPLATE_NAME=orden_lista_entrega
VITE_ORDER_TRACKING_URL=https://tudominio.com/rastrear/

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

## Paso 8: Plantillas de Mensaje de Meta (Recomendado para Producción)

### ¿Qué son las Plantillas de Meta?

WhatsApp ofrece dos tipos de mensajes:

#### 1. Mensajes de Texto Libre (Session Messages)
- ✅ **Ventaja**: No requiere aprobación previa
- ❌ **Limitación**: Solo puedes enviar si el cliente te escribió en las últimas 24 horas
- **Uso actual**: El sistema usa este método por defecto

#### 2. Mensajes de Plantilla (Template Messages)
- ✅ **Ventaja**: Puedes enviar en cualquier momento, sin importar cuándo fue el último mensaje
- ✅ **Ventaja**: Más profesional y confiable para notificaciones automáticas
- ❌ **Limitación**: Requiere crear y aprobar la plantilla en Meta Business Manager
- **Recomendado para**: Notificaciones de órdenes listas, recordatorios, confirmaciones

### Por Qué Usar Plantillas para Notificaciones de Órdenes

Las plantillas son **altamente recomendadas** porque:

1. **Sin límite de 24 horas**: Puedes notificar al cliente en cualquier momento que su orden esté lista
2. **Mayor confiabilidad**: Meta garantiza la entrega de mensajes de plantilla aprobados
3. **Profesional**: Las plantillas pasan por un proceso de revisión de calidad
4. **Mejor experiencia**: El cliente recibe la notificación sin necesidad de iniciar la conversación

### Cómo Crear una Plantilla en Meta Business Manager

#### Paso 1: Acceder a Message Templates

1. Ve a [Meta Business Manager](https://business.facebook.com/)
2. Navega a **"WhatsApp" > "Message Templates"**
3. Haz clic en **"Create Template"**

#### Paso 2: Configuración Básica

**Datos a completar:**

- **Name (Nombre)**: `orden_lista_entrega`
  - ⚠️ Importante: Usa solo letras minúsculas, números y guiones bajos
  - Este nombre lo usarás en tu código

- **Category (Categoría)**: Selecciona **UTILITY**
  - UTILITY es para notificaciones transaccionales (órdenes, confirmaciones, etc.)
  - NO uses MARKETING para notificaciones de órdenes

- **Languages (Idiomas)**: Selecciona **Spanish (Español)**

#### Paso 3: Diseñar el Contenido de la Plantilla

**Plantilla recomendada para Clean Master Shoes:**

```
¡Hola {{1}}! 👋

Tu orden #{{2}} está lista para recoger 🎉

⏰ Horario:
Lunes - Viernes 10:00 am - 6:00 pm
Sabado hasta las 4:00 pm

📦 Servicios completados: {{3}}

📍 Te esperamos en:{{4}}

🔍 Rastrea tu orden aquí:{{5}}

¡Gracias por tu confianza!
- Clean Master Shoes
```

**Variables dinámicas explicadas:**

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{1}}` | Nombre del cliente | "Juan Pérez" |
| `{{2}}` | Número de orden | "1234" |
| `{{3}}` | Lista de servicios completados | "• Limpieza profunda\n• Hidratación" |
| `{{4}}` | Dirección del negocio | "Av. Principal #123, Col. Centro" |
| `{{5}}` | URL para rastrear la orden | "https://tudominio.com/rastrear/abc123" |

#### Paso 4: Agregar Botones (Opcional)

Puedes agregar botones interactivos a tu plantilla:

**Botón de URL dinámica:**
- **Tipo de botón**: URL
- **Texto del botón**: "Ver mi orden"
- **URL**: `{{1}}` (variable dinámica)
- **Tipo de URL**: Dinámica

Cuando configures este botón, el sistema enviará la URL del parámetro 5 como botón clickeable.

#### Paso 5: Revisar y Enviar para Aprobación

1. **Revisa el preview**: Asegúrate de que el formato se vea bien
2. **Verifica los emojis**: Deben mostrarse correctamente
3. **Cuenta las variables**: Deben ser exactamente 5 en este caso
4. **Haz clic en "Submit"**: Envía para revisión de Meta

**Tiempo de aprobación:**
- Generalmente: 1-2 días hábiles
- A veces: Hasta 24-48 horas
- Recibirás un email cuando sea aprobada o rechazada

#### Paso 6: Configurar en tu Aplicación

Una vez que Meta apruebe tu plantilla:

1. Abre tu archivo `.env`
2. Agrega o actualiza estas variables:

```env
# Nombre exacto de la plantilla aprobada
VITE_WHATSAPP_TEMPLATE_NAME=orden_lista_entrega

# URL base para rastrear órdenes (puede ser temporal durante desarrollo)
VITE_ORDER_TRACKING_URL=https://tudominio.com/rastrear/
```

3. Guarda el archivo
4. Reinicia tu servidor de desarrollo

**El sistema automáticamente:**
- ✅ Detectará que hay una plantilla configurada
- ✅ Usará la plantilla de Meta en lugar de texto libre
- ✅ Enviará mensajes en cualquier momento (sin límite de 24h)
- ✅ Tendrá fallback automático a texto libre si la plantilla falla

### Consejos para Crear Buenas Plantillas

#### ✅ Hacer (DO):
- Usar lenguaje claro y directo
- Incluir información útil (horarios, dirección, etc.)
- Usar emojis con moderación (2-4 por mensaje)
- Mantener el tono profesional pero amigable
- Incluir llamadas a la acción claras

#### ❌ No Hacer (DON'T):
- No usar lenguaje de marketing agresivo en plantillas UTILITY
- No incluir información que cambie frecuentemente en texto fijo
- No usar más de 1024 caracteres
- No poner precios fijos (usa variables)
- No usar URLs acortadas (bit.ly, etc.)

### Razones Comunes de Rechazo

Si Meta rechaza tu plantilla, puede ser por:

1. **Categoría incorrecta**: Usar MARKETING para notificaciones transaccionales
2. **Contenido no claro**: Variables sin contexto explicativo
3. **Lenguaje promocional excesivo**: En plantillas UTILITY
4. **Formato incorrecto**: Problemas con sintaxis de variables
5. **Información engañosa**: Promesas que no puedes cumplir

**Solución**: Revisa el feedback de Meta, ajusta la plantilla y reenvía

### Mantenimiento de Plantillas

#### Editar una Plantilla Existente

⚠️ **No puedes editar una plantilla aprobada directamente**

Para hacer cambios:
1. Crea una nueva plantilla con un nombre diferente (ej: `orden_lista_entrega_v2`)
2. Envía para aprobación
3. Una vez aprobada, actualiza `VITE_WHATSAPP_TEMPLATE_NAME` en `.env`
4. Opcionalmente, elimina la plantilla antigua

#### Múltiples Plantillas

Puedes crear diferentes plantillas para diferentes escenarios:
- `orden_lista_entrega` - Orden lista para recoger
- `orden_recibida` - Confirmación de recepción
- `orden_en_proceso` - Actualización de progreso
- `recordatorio_entrega` - Recordatorio si no recogen

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

### Problemas Específicos con Plantillas

#### Error: "Template name not found" o "Invalid template"
**Causa**: El nombre de la plantilla no coincide con la aprobada en Meta

**Solución**:
1. Verifica que `VITE_WHATSAPP_TEMPLATE_NAME` en `.env` sea exactamente igual al nombre en Meta
2. El nombre debe estar en minúsculas con guiones bajos (ej: `orden_lista_entrega`)
3. Verifica que la plantilla esté en estado "Approved" en Meta Business Manager

#### Error: "Invalid parameters count"
**Causa**: El número de parámetros enviados no coincide con las variables de la plantilla

**Solución**:
1. Cuenta las variables `{{1}}`, `{{2}}`, etc. en tu plantilla de Meta
2. Verifica que el código envíe exactamente ese número de parámetros
3. Para la plantilla `orden_lista_entrega` deben ser exactamente 5 parámetros

#### Error: "Template not approved"
**Causa**: La plantilla aún está en revisión o fue rechazada

**Solución**:
1. Ve a Meta Business Manager > WhatsApp > Message Templates
2. Verifica el estado de tu plantilla
3. Si está "Pending", espera la aprobación
4. Si está "Rejected", lee el feedback y crea una nueva plantilla corregida

#### El sistema usa texto libre en lugar de plantilla
**Causa**: La plantilla no está configurada o el sistema detectó un problema

**Solución**:
1. Verifica que `VITE_WHATSAPP_TEMPLATE_NAME` esté configurado en `.env`
2. Revisa los logs de consola para ver por qué se activó el fallback
3. El sistema automáticamente usa texto libre si:
   - No hay `VITE_WHATSAPP_TEMPLATE_NAME` configurado
   - La plantilla devuelve error
   - No hay variables completas para enviar

#### Error: "Parameter validation failed"
**Causa**: Uno de los parámetros contiene caracteres no válidos o está vacío

**Solución**:
1. Verifica que ningún parámetro esté vacío (`null` o `undefined`)
2. Verifica caracteres especiales en las variables
3. Para el parámetro de URL ({{5}}), debe ser una URL válida
4. Si algún campo falta, proporciona un valor por defecto (ej: "No especificado")

#### Las plantillas están aprobadas pero no se envían
**Causa**: Puede ser un problema de permisos o configuración del token

**Solución**:
1. Verifica que tu Access Token tenga los permisos:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
2. Regenera el token si es necesario
3. Verifica que el Phone Number ID sea correcto
4. Revisa los logs detallados en la consola del navegador

#### URL de rastreo no funciona
**Causa**: La URL no está configurada o tiene formato incorrecto

**Solución**:
1. Verifica que `VITE_ORDER_TRACKING_URL` esté configurado en `.env`
2. Debe ser una URL completa: `https://tudominio.com/rastrear/`
3. Asegúrate de que termine con `/` para concatenar el ID correctamente
4. Si no tienes URL aún, puedes usar un placeholder temporal

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

**Última actualización**: Noviembre 2025 - Agregada sección completa de Plantillas de Meta
