# Firebase Security - Order Tracking

## 📋 Overview

Este documento explica cómo configurar las reglas de seguridad de Firebase para permitir el acceso público a la página de tracking de órdenes (`/rastrear/:token`) mientras se mantiene seguro el resto del sistema.

## 🔒 Reglas de Seguridad

### Aplicar Reglas

1. Abre el archivo `firestore.rules` en la raíz del proyecto
2. Ve a [Firebase Console](https://console.firebase.google.com/)
3. Selecciona tu proyecto
4. Navega a: **Firestore Database → Reglas**
5. Copia y pega el contenido de `firestore.rules`
6. Haz clic en **Publicar**

### Arquitectura de Seguridad

```
┌─────────────────────────────────────────────────────┐
│                  Firebase Firestore                  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  🔓 Acceso Público (sin auth):                      │
│     └── orders (solo lectura por trackingToken)     │
│     └── settings/business-profile (solo lectura)    │
│                                                      │
│  🔐 Acceso Privado (requiere auth):                 │
│     ├── orders (escritura)                          │
│     ├── clients                                     │
│     ├── services                                    │
│     ├── employees                                   │
│     ├── inventory                                   │
│     ├── expenses                                    │
│     └── cash-register-closures                      │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## 🎯 Cómo Funciona

### 1. Consulta Pública de Órdenes

**Flujo:**
```javascript
// Cliente abre: cleanmastershoes.company/rastrear/abc123xyz
↓
// OrderTracking.jsx llama:
getOrderByTrackingToken('abc123xyz')
↓
// Firestore consulta:
WHERE trackingToken == 'abc123xyz'
↓
// Firebase permite la lectura porque:
// - Es una consulta (query), no un get directo
// - El trackingToken es único y difícil de adivinar
```

**Importante:** Las reglas de Firestore NO pueden validar el token en queries, solo en lecturas directas. Por eso usamos un token único e impredecible.

### 2. Business Profile Público

El logo y datos del negocio son públicos para mostrarse en la página de tracking:

```javascript
// Cualquiera puede leer:
settings/business-profile
  ├── businessName
  ├── logoUrl
  ├── address
  └── phone
```

## 🛡️ Mejores Prácticas de Seguridad

### 1. **Tokens Únicos e Impredecibles**

Los tokens se generan con:
- 8 caracteres aleatorios (a-z, 0-9)
- 4 caracteres del timestamp
- Total: 12 caracteres

**Probabilidad de adivinar un token:**
- Espacio: 36^12 = 4.7 × 10^18 posibilidades
- Prácticamente imposible por fuerza bruta

### 2. **Campos Públicos vs Privados**

**✅ Campos Seguros para Exponer:**
```javascript
{
  orderNumber,      // Número de orden
  client,          // Nombre del cliente
  phone,           // Teléfono
  orderStatus,     // Estado
  services,        // Servicios solicitados
  photos,          // Fotos
  totalPrice,      // Total
  advancePayment,  // Anticipo
  deliveryDate     // Fecha de entrega
}
```

**❌ Campos Sensibles (NO exponer):**
```javascript
{
  generalNotes,    // Notas internas del negocio
  author,          // Empleado que creó la orden
  cost,            // Costo interno
  margin,          // Margen de ganancia
  employeeNotes    // Notas privadas
}
```

### 3. **Limitaciones de Firestore Rules**

**Problema:** Firestore no puede validar el token en una `query`:
```javascript
// ❌ NO FUNCIONA - Las rules no aplican a queries
allow read: if resource.data.trackingToken == request.query.token;
```

**Solución:** Usar tokens únicos + App Check (opcional)

## 🚀 Seguridad Adicional (Opcional)

### Firebase App Check

Para prevenir abuse de la API pública:

1. Habilita [Firebase App Check](https://firebase.google.com/docs/app-check)
2. Configura reCAPTCHA v3 para web
3. Solo requests con App Check token válido serán permitidas

### Rate Limiting

Considera implementar rate limiting con Cloud Functions:

```javascript
// Cloud Function que intercepta consultas
exports.trackOrder = functions.https.onCall(async (data, context) => {
  const { token } = data;

  // Rate limit: max 10 consultas por IP por hora
  const ip = context.rawRequest.ip;
  if (await isRateLimited(ip)) {
    throw new functions.https.HttpsError('resource-exhausted', 'Too many requests');
  }

  return await getOrderByTrackingToken(token);
});
```

## 📊 Monitoreo

### Revisar Uso de Firestore

1. Ve a Firebase Console
2. Navega a: **Firestore Database → Uso**
3. Monitorea:
   - Lecturas por día
   - Picos inusuales de consultas
   - Queries lentas

### Alertas Recomendadas

Configura alertas si:
- Lecturas > 10,000/día (ajusta según tu escala)
- Queries lentas > 1 segundo
- Errores de permisos aumentan

## 🔧 Testing de Seguridad

### Probar Reglas en Firebase Console

1. Ve a **Firestore Database → Reglas**
2. Haz clic en **Simulador de reglas**
3. Prueba:

```javascript
// Test 1: Lectura pública de orden por token ✅
Location: /orders/{orderId}
Mode: Read
Auth: Unauthenticated
Data: { trackingToken: "abc123xyz" }

// Test 2: Lectura de business profile ✅
Location: /settings/business-profile
Mode: Read
Auth: Unauthenticated

// Test 3: Escritura sin auth ❌ (debe fallar)
Location: /orders/{orderId}
Mode: Write
Auth: Unauthenticated
```

## 📝 Checklist de Seguridad

Antes de ir a producción:

- [ ] Aplicar `firestore.rules` en Firebase Console
- [ ] Verificar que los tokens son únicos y aleatorios
- [ ] Confirmar que solo campos públicos se exponen en `getOrderByTrackingToken()`
- [ ] Probar acceso público a `/rastrear/:token`
- [ ] Probar que rutas privadas requieren autenticación
- [ ] (Opcional) Configurar Firebase App Check
- [ ] (Opcional) Implementar rate limiting
- [ ] Configurar alertas de uso en Firebase Console
- [ ] Documentar tokens en base de datos para auditoría

## 🆘 Troubleshooting

### Error: "Missing or insufficient permissions"

**Causa:** Las reglas no permiten la operación

**Solución:**
1. Verifica que las reglas estén publicadas
2. Revisa que el token sea correcto
3. Usa el simulador de reglas para debuggear

### Error: Query too slow

**Causa:** Falta índice en Firestore

**Solución:**
1. Firebase te mostrará un link para crear el índice
2. Haz clic y espera a que se cree (1-2 minutos)

## 📚 Referencias

- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase App Check](https://firebase.google.com/docs/app-check)
- [Best Practices for Security Rules](https://firebase.google.com/docs/rules/rules-and-auth)
