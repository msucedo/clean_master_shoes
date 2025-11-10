# USER STORY: Implementar Plantilla de WhatsApp Profesional

**Como:** Dueño de Clean Master Shoes
**Quiero:** Enviar mensajes profesionales de WhatsApp usando plantillas de Meta
**Para:** Notificar a clientes cuando su orden esté lista, sin límite de 24 horas

**Fecha de inicio:** 2025-11-05
**Fecha estimada de retoma:** 2025-11-07 (en 2 días)

---

## 📚 FASE 1: Actualizar Documentación

**Responsable:** Claude
**Estado:** ✅ COMPLETADA
**Cuándo:** 2025-11-05

### Tareas:
- [x] Agregar sección "Plantillas de Meta" en `WHATSAPP_SETUP.md`
- [x] Documentar cómo crear plantillas en Meta Business Manager
- [x] Documentar nuevas variables de entorno
- [x] Agregar troubleshooting de plantillas

**Archivos modificados:**
- `WHATSAPP_SETUP.md` - Sección completa de Plantillas de Meta agregada
- `.env.example` - Variables `VITE_WHATSAPP_TEMPLATE_NAME` y `VITE_ORDER_TRACKING_URL` agregadas

---

## 📋 FASE 2: Configuración en Meta Business

**Responsable:** Usuario (tú)
**Estado:** ⏳ Pendiente
**Cuándo:** Después de Fase 1

### Subfase 2.1: Crear Plantilla
- [ ] Ir a: https://business.facebook.com/wa/manage/message-templates/
- [ ] Click en "Crear plantilla"
- [ ] Nombre: `orden_lista_entrega`
- [ ] Categoría: **UTILITY** (importante para transaccionales)
- [ ] Idioma: Español

### Subfase 2.2: Definir Contenido

**Plantilla exacta a usar:**

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

**Variables dinámicas:**
1. `{{1}}` = Nombre del cliente
2. `{{2}}` = Número de orden
3. `{{3}}` = Lista de servicios completados
4. `{{4}}` = Dirección del negocio
5. `{{5}}` = URL para rastrear la orden

### Subfase 2.3: Enviar para Aprobación
- [ ] Revisar preview en Meta
- [ ] Click en "Enviar"
- [ ] Esperar email de aprobación (1-2 días)
- [ ] Guardar nombre exacto de la plantilla aprobada: `________________`

---

## ⏳ FASE 3: Espera de Aprobación

**Responsable:** Meta
**Estado:** ⏳ Pendiente
**Duración estimada:** 1-2 días hábiles

### Tareas:
- [ ] Recibir email de confirmación de Meta
- [ ] Verificar que el nombre de la plantilla sea: `orden_lista_entrega`
- [ ] Anotar fecha de aprobación: `________________`

---

## 💻 FASE 4: Implementación de Código

**Responsable:** Claude
**Estado:** ⏳ Pendiente
**Cuándo:** Cuando retomes en 2 días (después de aprobación de Meta)

### Subfase 4.1: Configurar Variables de Entorno

**Archivo:** `.env.example`

- [ ] Agregar `VITE_WHATSAPP_TEMPLATE_NAME=orden_lista_entrega`
- [ ] Agregar `VITE_ORDER_TRACKING_URL=https://tudominio.com/rastrear/`
- [ ] Documentar variables nuevas con comentarios

### Subfase 4.2: Crear Función de Plantilla

**Archivo:** `src/services/whatsappService.js`

- [ ] Crear función `sendTemplateMessage(to, templateName, components)`
- [ ] Implementar formato de componentes según API de Meta
- [ ] Agregar manejo de errores específico de plantillas
- [ ] Agregar logs detallados para debugging

**Estructura de componentes esperada:**
```javascript
{
  type: "template",
  template: {
    name: "orden_lista_entrega",
    language: { code: "es" },
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: "Nombre Cliente" },
          { type: "text", text: "1234" },
          { type: "text", text: "• Servicio 1\n• Servicio 2" },
          { type: "text", text: "Dirección del negocio" },
          { type: "text", text: "https://..." }
        ]
      }
    ]
  }
}
```

### Subfase 4.3: Adaptar Mensaje de Entrega

**Archivo:** `src/services/whatsappService.js`

- [ ] Actualizar `sendDeliveryNotification()` para detectar si hay plantilla configurada
- [ ] Si `VITE_WHATSAPP_TEMPLATE_NAME` existe: usar `sendTemplateMessage()`
- [ ] Si no existe: usar método actual de texto libre (fallback)
- [ ] Construir array de parámetros dinámicos correctamente
- [ ] Formatear lista de servicios con bullets

### Subfase 4.4: Construir URL de Rastreo

**Archivo:** `src/services/whatsappService.js`

- [ ] Crear función `buildOrderTrackingUrl(orderId)`
- [ ] Combinar `VITE_ORDER_TRACKING_URL` + `orderId`
- [ ] Validar que URL esté configurada en .env
- [ ] Si no hay URL configurada, usar placeholder o saltar parámetro

**Ejemplo de URL generada:**
```
https://tudominio.com/rastrear/abc123def456
```

---

## 🧪 FASE 5: Pruebas

**Responsable:** Ambos
**Estado:** ⏳ Pendiente
**Cuándo:** Inmediatamente después de Fase 4

### Subfase 5.1: Prueba Básica
- [ ] Configurar `.env` local con `VITE_WHATSAPP_TEMPLATE_NAME=orden_lista_entrega`
- [ ] Configurar `VITE_ORDER_TRACKING_URL` (puede ser URL de prueba)
- [ ] Crear orden de prueba en el sistema
- [ ] Cambiar estado a "En Entrega"
- [ ] Verificar que el mensaje llegue al WhatsApp
- [ ] Verificar que use la plantilla (no texto libre)

### Subfase 5.2: Prueba de Variables
- [ ] Verificar nombre del cliente esté correcto
- [ ] Verificar número de orden esté correcto
- [ ] Verificar lista de servicios esté completa y formateada
- [ ] Verificar dirección del negocio esté correcta
- [ ] Verificar URL de rastreo funcione (click en el enlace)
- [ ] Verificar que el horario se muestre correctamente

### Subfase 5.3: Prueba de Fallback
- [ ] Remover `VITE_WHATSAPP_TEMPLATE_NAME` de `.env`
- [ ] Crear orden de prueba
- [ ] Cambiar a "En Entrega"
- [ ] Verificar que use texto libre como respaldo
- [ ] Verificar mensaje de fallback funcione correctamente
- [ ] Restaurar `VITE_WHATSAPP_TEMPLATE_NAME` en `.env`

**Resultados esperados:**
- ✅ Mensaje llega con plantilla de Meta
- ✅ Todas las variables se reemplazan correctamente
- ✅ Formato es profesional y legible
- ✅ URL de rastreo es clickeable
- ✅ Fallback funciona si no hay plantilla

---

## 📊 FASE 6: Producción

**Responsable:** Ambos
**Estado:** ⏳ Pendiente
**Cuándo:** Después de pruebas exitosas

### Subfase 6.1: Deploy
- [ ] Actualizar `.env` en servidor de producción con:
  - `VITE_WHATSAPP_TEMPLATE_NAME=orden_lista_entrega`
  - `VITE_ORDER_TRACKING_URL=https://...` (URL real)
- [ ] Hacer commit de cambios en código
- [ ] Desplegar código nuevo a producción
- [ ] Verificar logs en consola del servidor

### Subfase 6.2: Monitoreo
- [ ] Crear orden real de prueba con cliente de confianza
- [ ] Verificar mensaje llegue correctamente
- [ ] Solicitar feedback del cliente sobre el mensaje
- [ ] Monitorear primeros 5-10 envíos en producción
- [ ] Verificar estadísticas en Meta Business Manager
- [ ] Revisar tasa de entrega y errores

**Métricas a monitorear:**
- Tasa de entrega exitosa
- Tiempo de entrega
- Errores de plantilla
- Feedback de clientes

---

## 📝 Archivos que se Modificarán

1. **`WHATSAPP_SETUP.md`** (Fase 1)
   - Nueva sección de plantillas de Meta
   - Documentación de configuración

2. **`.env.example`** (Fase 4.1)
   - `VITE_WHATSAPP_TEMPLATE_NAME`
   - `VITE_ORDER_TRACKING_URL`

3. **`src/services/whatsappService.js`** (Fase 4.2-4.4)
   - Función `sendTemplateMessage()`
   - Función `buildOrderTrackingUrl()`
   - Actualización de `sendDeliveryNotification()`

---

## 🔑 Información Importante para Guardar

### Para cuando retomes en 2 días:

1. **Nombre de plantilla aprobada por Meta:** `orden_lista_entrega`
2. **Fecha de aprobación:** `________________`
3. **Link a esta conversación/plan:** Guardar este archivo MD
4. **Variables de entorno necesarias:**
   - Template name
   - URL de rastreo

### Checklist rápido antes de implementar Fase 4:
- [ ] Plantilla aprobada por Meta ✅
- [ ] Nombre exacto de plantilla anotado
- [ ] URL de rastreo definida (aunque sea temporal)
- [ ] Esta documentación revisada

---

## 🚨 Troubleshooting Común

### Error: Plantilla no encontrada
- Verificar que el nombre en `.env` coincida EXACTAMENTE con Meta
- Verificar que la plantilla esté en estado "Approved"

### Error: Parámetros inválidos
- Verificar que el número de parámetros coincida (5 variables)
- Verificar que no haya variables vacías o null

### Mensaje no llega
- Verificar logs en consola
- Verificar que el token de WhatsApp sea válido
- Verificar que el número de teléfono esté en formato correcto

### Fallback se activa siempre
- Verificar que `VITE_WHATSAPP_TEMPLATE_NAME` esté configurado
- Verificar que no haya typos en el nombre

---

## 📞 Contacto y Soporte

Si tienes problemas durante la implementación:
1. Revisar logs en `src/services/whatsappService.js`
2. Verificar configuración en Meta Business Manager
3. Consultar documentación oficial de WhatsApp Business API

---

**Última actualización:** 2025-11-05
**Próxima revisión:** 2025-11-07 (Fase 4 - Implementación)
