import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Script de migración para agregar el campo isAdmin a empleados existentes
 *
 * INSTRUCCIONES DE USO:
 * 1. Abre la consola del navegador (F12)
 * 2. Ejecuta: await migrateEmployees()
 * 3. El script agregará isAdmin:false a todos los empleados
 * 4. Si no hay ningún admin, promoverá al primer empleado activo
 */

/**
 * Agrega el campo isAdmin a todos los empleados que no lo tengan
 */
export const migrateEmployees = async () => {
  try {
    console.log('🚀 [MIGRATE] Iniciando migración de empleados...');

    const employeesRef = collection(db, 'employees');
    const querySnapshot = await getDocs(employeesRef);

    let updatedCount = 0;
    let skipCount = 0;

    // 1. Agregar isAdmin: false a todos los empleados que no lo tengan
    for (const docSnapshot of querySnapshot.docs) {
      const employeeData = docSnapshot.data();

      // Si ya tiene el campo isAdmin, skip
      if ('isAdmin' in employeeData) {
        console.log(`⏭️  [MIGRATE] Skip ${employeeData.name} - ya tiene campo isAdmin`);
        skipCount++;
        continue;
      }

      // Agregar isAdmin: false
      const employeeRef = doc(db, 'employees', docSnapshot.id);
      await updateDoc(employeeRef, {
        isAdmin: false,
        updatedAt: new Date().toISOString()
      });

      console.log(`✅ [MIGRATE] Actualizado ${employeeData.name} -> isAdmin: false`);
      updatedCount++;
    }

    console.log(`📊 [MIGRATE] Migración completada:`);
    console.log(`   - Actualizados: ${updatedCount}`);
    console.log(`   - Omitidos: ${skipCount}`);

    // 2. Verificar si hay al menos un admin activo
    const adminQuery = query(
      employeesRef,
      where('isAdmin', '==', true),
      where('status', '==', 'active')
    );
    const adminSnapshot = await getDocs(adminQuery);

    if (adminSnapshot.empty) {
      console.log('⚠️  [MIGRATE] No hay administradores activos. Buscando empleado con rol "Developer"...');

      // Buscar el empleado con rol "Developer"
      const developerQuery = query(
        employeesRef,
        where('role', '==', 'Developer'),
        where('status', '==', 'active')
      );
      const developerSnapshot = await getDocs(developerQuery);

      if (!developerSnapshot.empty) {
        // Promover al Developer
        const developer = developerSnapshot.docs[0];
        const employeeRef = doc(db, 'employees', developer.id);

        await updateDoc(employeeRef, {
          isAdmin: true,
          updatedAt: new Date().toISOString()
        });

        console.log(`👑 [MIGRATE] ${developer.data().name} (Developer) promovido a administrador`);
      } else {
        // Fallback: buscar el primer empleado activo
        console.log('⚠️  [MIGRATE] No se encontró empleado "Developer". Promoviendo al primer empleado activo...');

        const activeQuery = query(employeesRef, where('status', '==', 'active'));
        const activeSnapshot = await getDocs(activeQuery);

        if (!activeSnapshot.empty) {
          const firstEmployee = activeSnapshot.docs[0];
          const employeeRef = doc(db, 'employees', firstEmployee.id);

          await updateDoc(employeeRef, {
            isAdmin: true,
            updatedAt: new Date().toISOString()
          });

          console.log(`👑 [MIGRATE] ${firstEmployee.data().name} promovido a administrador (fallback)`);
        } else {
          console.log('❌ [MIGRATE] No hay empleados activos para promover');
        }
      }
    } else {
      console.log(`✅ [MIGRATE] Ya existen ${adminSnapshot.size} administrador(es) activo(s)`);
    }

    console.log('🎉 [MIGRATE] Migración completada exitosamente');

    return {
      success: true,
      updated: updatedCount,
      skipped: skipCount
    };

  } catch (error) {
    console.error('❌ [MIGRATE] Error en migración:', error);
    throw error;
  }
};

/**
 * Función helper para verificar cuántos admins hay
 */
export const checkAdminStatus = async () => {
  try {
    const employeesRef = collection(db, 'employees');

    // Contar total de empleados
    const allSnapshot = await getDocs(employeesRef);
    const total = allSnapshot.size;

    // Contar admins activos
    const adminQuery = query(
      employeesRef,
      where('isAdmin', '==', true),
      where('status', '==', 'active')
    );
    const adminSnapshot = await getDocs(adminQuery);

    console.log('📊 [STATUS] Estado de administradores:');
    console.log(`   - Total empleados: ${total}`);
    console.log(`   - Administradores activos: ${adminSnapshot.size}`);

    adminSnapshot.forEach((doc) => {
      const emp = doc.data();
      console.log(`   👑 ${emp.name} (${emp.email})`);
    });

    return {
      totalEmployees: total,
      activeAdmins: adminSnapshot.size
    };
  } catch (error) {
    console.error('❌ [STATUS] Error al verificar status:', error);
    throw error;
  }
};

// Exponer funciones en window para uso en consola
if (typeof window !== 'undefined') {
  window.migrateEmployees = migrateEmployees;
  window.checkAdminStatus = checkAdminStatus;
}
