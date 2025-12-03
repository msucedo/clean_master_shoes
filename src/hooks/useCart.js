import { useContext } from 'react';
import { CartContext } from '../context/CartContext';

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart debe usarse dentro de CartProvider');
  }

  // Agregar producto con validación de stock
  const addProductWithValidation = (product, quantity = 1) => {
    if (!product) {
      console.error('Producto inválido');
      return false;
    }

    // Verificar si hay stock disponible
    if (product.stock === undefined || product.stock === null) {
      alert('Este producto no tiene información de stock');
      return false;
    }

    // Calcular cantidad actual en el carrito
    const existingItem = context.cartItems.find(item => item.id === product.id);
    const currentQuantityInCart = existingItem ? existingItem.quantity : 0;
    const newTotalQuantity = currentQuantityInCart + quantity;

    // Validar que no exceda el stock disponible
    if (newTotalQuantity > product.stock) {
      const availableToAdd = product.stock - currentQuantityInCart;
      if (availableToAdd > 0) {
        alert(`Solo puedes agregar ${availableToAdd} unidad(es) más. Stock disponible: ${product.stock}`);
      } else {
        alert(`Este producto ya está en el carrito con la cantidad máxima disponible (${product.stock})`);
      }
      return false;
    }

    // Validar que el precio sea válido
    if (!product.salePrice || product.salePrice <= 0) {
      alert('Este producto no tiene un precio de venta válido');
      return false;
    }

    context.addProduct(product, quantity);
    return true;
  };

  // Actualizar cantidad con validación de stock
  const updateQuantityWithValidation = (productId, newQuantity) => {
    const item = context.cartItems.find(i => i.id === productId);

    if (!item) {
      return false;
    }

    // Si la nueva cantidad es 0 o negativa, eliminar el producto
    if (newQuantity <= 0) {
      context.removeProduct(productId);
      return true;
    }

    // Validar que no exceda el stock
    if (newQuantity > item.stock) {
      alert(`Stock insuficiente. Disponible: ${item.stock}`);
      return false;
    }

    context.updateQuantity(productId, newQuantity);
    return true;
  };

  // Incrementar cantidad de un producto
  const incrementQuantity = (productId) => {
    const item = context.cartItems.find(i => i.id === productId);
    if (!item) return false;

    return updateQuantityWithValidation(productId, item.quantity + 1);
  };

  // Decrementar cantidad de un producto
  const decrementQuantity = (productId) => {
    const item = context.cartItems.find(i => i.id === productId);
    if (!item) return false;

    return updateQuantityWithValidation(productId, item.quantity - 1);
  };

  // Validar si se puede proceder al pago
  const canCheckout = () => {
    if (context.cartItems.length === 0) {
      return { valid: false, message: 'El carrito está vacío' };
    }

    // Verificar que todos los productos tengan stock suficiente
    for (const item of context.cartItems) {
      if (item.quantity > item.stock) {
        return {
          valid: false,
          message: `Stock insuficiente para ${item.name}. Disponible: ${item.stock}`
        };
      }
    }

    if (context.total <= 0) {
      return { valid: false, message: 'El total debe ser mayor a 0' };
    }

    return { valid: true, message: 'OK' };
  };

  return {
    ...context,
    addProductWithValidation,
    updateQuantityWithValidation,
    incrementQuantity,
    decrementQuantity,
    canCheckout
  };
};
