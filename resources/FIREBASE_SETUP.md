# Guía de Configuración de Firebase

Esta guía te ayudará a configurar Firebase Firestore para tu aplicación Clean Master Shoes.

## Paso 1: Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Agregar proyecto" o "Create project"
3. Ingresa el nombre del proyecto: `clean-master-shoes` (o el que prefieras)
4. Desactiva Google Analytics si no lo necesitas (puedes activarlo después)
5. Haz clic en "Crear proyecto" y espera a que se complete

## Paso 2: Habilitar Firestore Database

1. En el menú lateral, ve a "Build" > "Firestore Database"
2. Haz clic en "Create database"
3. Selecciona modo de producción (configuraremos las reglas después)
4. Elige la ubicación más cercana (por ejemplo: `us-central` para México/Latinoamérica)
5. Haz clic en "Enable"

## Paso 3: Obtener Credenciales de Firebase

1. En Firebase Console, haz clic en el ícono de engranaje ⚙️ > "Project settings"
2. Baja hasta la sección "Your apps" (Tus apps)
3. Haz clic en el ícono web `</>`
4. Registra la app con un nombre (ejemplo: "Clean Master Web")
5. NO marques "Firebase Hosting" por ahora
6. Copia el objeto `firebaseConfig` que aparece

## Paso 4: Configurar Variables de Entorno

1. En tu proyecto, copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Abre el archivo `.env` y llena los valores con los datos de tu `firebaseConfig`:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=clean-master-shoes.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=clean-master-shoes
   VITE_FIREBASE_STORAGE_BUCKET=clean-master-shoes.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

3. **IMPORTANTE**: NUNCA subas el archivo `.env` a Git. Ya está en `.gitignore`

## Paso 5: Configurar Reglas de Seguridad

1. En Firebase Console, ve a "Firestore Database" > pestaña "Rules"
2. Para desarrollo, usa estas reglas (TEMPORAL):

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```

3. Haz clic en "Publish"

⚠️ **IMPORTANTE**: Estas reglas permiten acceso completo a todos. Para producción, implementa autenticación y usa reglas más restrictivas.

### Reglas Recomendadas para Producción (después de implementar auth):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Órdenes - solo el usuario autenticado
    match /orders/{orderId} {
      allow read, write: if request.auth != null;
    }

    // Servicios - solo el usuario autenticado
    match /services/{serviceId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Paso 6: Iniciar la Aplicación

1. Instala las dependencias (si no lo has hecho):
   ```bash
   npm install
   ```

2. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

3. Abre tu navegador en `http://localhost:5173`

## Verificación

Para verificar que Firebase está funcionando correctamente:

1. Ve a la pestaña "Servicios" en tu app
2. Agrega un servicio de prueba
3. En Firebase Console > Firestore Database, deberías ver una colección `services` con el documento que creaste
4. Crea una orden de prueba en la pestaña "Órdenes"
5. Deberías ver una colección `orders` en Firestore

## Características de Firebase

### Sincronización en Tiempo Real
- Los datos se sincronizan automáticamente entre dispositivos
- Si abres la app en múltiples pestañas, verás los cambios en tiempo real

### Backup Automático
- Firebase hace backups automáticos de tu base de datos
- Además, puedes descargar backups manuales desde Settings > Backup de Datos

### Funcionalidad Offline
- Firebase cachea los datos localmente
- La app seguirá funcionando sin internet (con datos cacheados)
- Cuando vuelva la conexión, sincronizará automáticamente

## Costos y Límites

### Plan Gratuito (Spark):
- 50,000 lecturas/día
- 20,000 escrituras/día
- 20,000 eliminaciones/día
- 1 GB de almacenamiento

Para un negocio pequeño/mediano, el plan gratuito debería ser suficiente.

### Plan Blaze (Pago por uso):
Si excedes los límites gratuitos:
- $0.06 por 100,000 lecturas
- $0.18 por 100,000 escrituras
- $0.02 por 100,000 eliminaciones
- $0.18 por GB de almacenamiento/mes

## Soporte y Problemas

Si tienes problemas:

1. Verifica que el archivo `.env` tenga los valores correctos
2. Revisa la consola del navegador (F12) para ver errores
3. Verifica que Firestore esté habilitado en Firebase Console
4. Asegúrate de que las reglas de seguridad permitan lectura/escritura

## Próximos Pasos

1. ✅ Firebase configurado y funcionando
2. 🔜 Implementar autenticación de usuarios (Firebase Auth)
3. 🔜 Configurar reglas de seguridad apropiadas
4. 🔜 Configurar backups automáticos programados
5. 🔜 Monitorear uso en Firebase Console

---

**¡Listo!** Tu aplicación ahora está respaldada por Firebase y tus datos están seguros en la nube. 🎉
