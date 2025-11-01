import { createContext, useContext, useState, useEffect } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { getEmployeeByEmail } from '../services/firebaseService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Custom hook para verificar si el usuario actual es admin
 * @returns {boolean} true si el usuario es admin y está activo
 */
export const useAdminCheck = () => {
  const { employee } = useAuth();
  return employee?.isAdmin === true && employee?.status === 'active';
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Firebase user
  const [employee, setEmployee] = useState(null); // Employee data from Firestore
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔐 [AUTH] onAuthStateChanged:', firebaseUser?.email);

      if (firebaseUser) {
        try {
          // Verificar que el usuario tenga un email
          if (!firebaseUser.email) {
            console.error('❌ [AUTH] Usuario sin email');
            await signOut(auth);
            setUser(null);
            setEmployee(null);
            setError('No se pudo obtener el email del usuario');
            setLoading(false);
            return;
          }

          // Buscar empleado en Firestore por email
          const employeeData = await getEmployeeByEmail(firebaseUser.email);

          if (!employeeData) {
            // Email no registrado en empleados
            console.error('❌ [AUTH] Email no autorizado:', firebaseUser.email);
            await signOut(auth);
            setUser(null);
            setEmployee(null);
            setError('Tu correo no está autorizado para acceder a esta aplicación. Contacta al administrador.');
            setLoading(false);
            return;
          }

          // Verificar que el empleado esté activo
          if (employeeData.status !== 'active') {
            console.error('❌ [AUTH] Empleado inactivo:', firebaseUser.email);
            await signOut(auth);
            setUser(null);
            setEmployee(null);
            setError('Tu cuenta está inactiva. Contacta al administrador.');
            setLoading(false);
            return;
          }

          // Todo OK: usuario autenticado y autorizado
          console.log('✅ [AUTH] Usuario autenticado y autorizado:', employeeData.name);
          setUser(firebaseUser);
          setEmployee(employeeData);
          setError(null);
        } catch (err) {
          console.error('❌ [AUTH] Error al verificar empleado:', err);
          await signOut(auth);
          setUser(null);
          setEmployee(null);
          setError('Error al verificar permisos. Intenta de nuevo.');
        }
      } else {
        // No hay usuario autenticado
        setUser(null);
        setEmployee(null);
        setError(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Login with Google
  const loginWithGoogle = async () => {
    try {
      setError(null);

      console.log('🚀 [AUTH] Iniciando login con Google...');

      // Configurar provider para forzar selección de cuenta
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(auth, googleProvider);
      console.log('✅ [AUTH] Popup cerrado exitosamente');

      // onAuthStateChanged manejará la validación del empleado
      return result.user;
    } catch (err) {
      console.error('❌ [AUTH] Error en login:', err);

      // Manejar errores específicos de Google Auth
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Inicio de sesión cancelado');
      } else if (err.code === 'auth/popup-blocked') {
        setError('El navegador bloqueó la ventana de inicio de sesión. Por favor permite las ventanas emergentes.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('Inicio de sesión cancelado');
      } else {
        setError('Error al iniciar sesión con Google. Intenta de nuevo.');
      }

      throw err;
    }
  };

  // Logout
  const logout = async () => {
    try {
      console.log('👋 [AUTH] Cerrando sesión...');
      await signOut(auth);
      setUser(null);
      setEmployee(null);
      setError(null);
      console.log('✅ [AUTH] Sesión cerrada exitosamente');
    } catch (err) {
      console.error('❌ [AUTH] Error al cerrar sesión:', err);
      setError('Error al cerrar sesión');
      throw err;
    }
  };

  const value = {
    user,
    employee,
    loading,
    error,
    loginWithGoogle,
    logout,
    clearError: () => setError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
