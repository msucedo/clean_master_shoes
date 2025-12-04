import { createContext, useState, useEffect, useRef, useMemo } from 'react';
import { usePromotions } from '../hooks/usePromotions';

export const CartContext = createContext();

const CART_STORAGE_KEY = 'cleanmaster_cart';

export const CartProvider = ({ children }) => {
  // Usar hook de React Query para promociones (subscripción compartida)
  const { data: allPromotions = [] } = usePromotions();

  const [cartItems, setCartItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('amount'); // 'amount' o 'percentage'
  const [notes, setNotes] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  // Estados de promociones
  const [appliedPromotions, setAppliedPromotions] = useState([]);
  const [promotionValidations, setPromotionValidations] = useState({});

  // Ref para debounce de guardado en localStorage
  const saveTimeoutRef = useRef(null);

  // Cargar carrito desde localStorage al montar
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        setCartItems(parsed.items || []);
        setDiscount(parsed.discount || 0);
        setDiscountType(parsed.discountType || 'amount');
        setNotes(parsed.notes || '');
        setSelectedClient(parsed.selectedClient || null);
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
  }, []);

  // Guardar carrito en localStorage con debounce de 500ms
  useEffect(() => {
    // Limpiar timeout previo
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Guardar después de 500ms de inactividad
    saveTimeoutRef.current = setTimeout(() => {
      try {
        const cartData = {
          items: cartItems,
          discount,
          discountType,
          notes,
          selectedClient
        };
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    }, 500);

    // Cleanup: cancelar timeout si el componente se desmonta
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [cartItems, discount, discountType, notes, selectedClient]);

  // ========== FUNCIONES DE PROMOCIONES (copiado de OrderForm) ==========

  // Determinar si una promoción es relevante para el carrito actual
  const isPromotionRelevantForCart = (promotion, cart) => {
    if (cart.length === 0) return false;

    switch (promotion.type) {
      case 'percentage':
        if (promotion.appliesTo === 'all') {
          return true; // Aplica a todo
        } else if (promotion.appliesTo === 'services') {
          return cart.some(item => item.type === 'service');
        } else if (promotion.appliesTo === 'products') {
          return cart.some(item => item.type === 'product');
        } else if (promotion.appliesTo === 'specific' && promotion.specificItems) {
          return cart.some(item => {
            // En carrito de inventario, los items son productos con productId = id
            const itemId = item.id;
            return promotion.specificItems.includes(itemId);
          });
        }
        return false;

      case 'fixed':
        // Si no hay items específicos, aplica a todo
        if (!promotion.applicableItems || promotion.applicableItems.length === 0) {
          return true;
        }
        // Si hay items específicos, verificar que estén en el carrito
        return cart.some(item => {
          const itemId = item.id;
          return promotion.applicableItems.includes(itemId);
        });

      case 'buyXgetY':
      case 'buyXgetYdiscount':
        // Si no hay items específicos, aplica a todo
        if (!promotion.applicableItems || promotion.applicableItems.length === 0) {
          return true;
        }
        // Si hay items específicos, verificar que estén en el carrito
        return cart.some(item => {
          const itemId = item.id;
          return promotion.applicableItems.includes(itemId);
        });

      case 'combo':
        // Relevante si AL MENOS UN item del combo está en el carrito
        if (!promotion.comboItems || promotion.comboItems.length === 0) {
          return false;
        }
        return promotion.comboItems.some(comboItem => {
          return cart.some(cartItem => {
            return cartItem.id === comboItem.id;
          });
        });

      case 'dayOfWeek':
        // Aplica a cualquier compra en ese día
        return true;

      default:
        return false;
    }
  };

  // Determinar la prioridad de una promoción (1 = alta, 3 = baja)
  const getPromotionPriority = (promo) => {
    // Prioridad ALTA (específicas): 1
    if (promo.type === 'percentage' && promo.appliesTo === 'specific') return 1;
    if (promo.type === 'fixed' && promo.applicableItems?.length > 0) return 1;
    if (promo.type === 'buyXgetY' && promo.applicableItems?.length > 0) return 1;
    if (promo.type === 'buyXgetYdiscount' && promo.applicableItems?.length > 0) return 1;
    if (promo.type === 'combo') return 1;

    // Prioridad MEDIA (por tipo): 2
    if (promo.type === 'percentage' && promo.appliesTo === 'services') return 2;
    if (promo.type === 'percentage' && promo.appliesTo === 'products') return 2;

    // Prioridad BAJA (generales): 3
    return 3;
  };

  // Determinar qué items del carrito deben mostrar badge para buyXgetY y buyXgetYdiscount
  const getItemsWithPromoBadge = (promotion, cart, itemPromotionMap = new Map()) => {
    // Filtrar items aplicables según la configuración de la promoción
    const applicableItems = cart.filter(item => {
      // Si el item ya tiene una promo asignada diferente, excluirlo
      const assignedPromo = itemPromotionMap.get(item.id);
      if (assignedPromo && assignedPromo.id !== promotion.id) {
        return false;
      }

      // Verificar si la promo aplica a este item
      if (!promotion.applicableItems || promotion.applicableItems.length === 0) {
        return true; // Aplica a todos los items
      }
      const itemId = item.id;
      return promotion.applicableItems.includes(itemId);
    });

    if (promotion.type === 'buyXgetY') {
      // Calcular cuántos items son gratis
      const totalQty = applicableItems.reduce((sum, i) => sum + (i.quantity || 1), 0);
      const sets = Math.floor(totalQty / promotion.buyQuantity);
      const freeItemsCount = sets * promotion.getQuantity;

      if (freeItemsCount === 0) return [];

      // Ordenar por precio (menor a mayor) para encontrar los más baratos
      const sorted = [...applicableItems].sort((a, b) => a.salePrice - b.salePrice);
      const freeItemIds = [];
      let remaining = freeItemsCount;

      for (const item of sorted) {
        if (remaining <= 0) break;
        const itemQty = item.quantity || 1;
        const qtyToMark = Math.min(itemQty, remaining);

        // Si el item completo (todas sus cantidades) es gratis, agregarlo
        if (qtyToMark === itemQty) {
          freeItemIds.push(item.id);
        }
        remaining -= qtyToMark;
      }

      return freeItemIds;
    }

    if (promotion.type === 'buyXgetYdiscount') {
      // Calcular cuántos items reciben descuento (los más baratos)
      const totalQty = applicableItems.reduce((sum, i) => sum + (i.quantity || 1), 0);
      const sets = Math.floor(totalQty / promotion.buyQuantity);

      if (sets === 0) return [];

      const sorted = [...applicableItems].sort((a, b) => a.salePrice - b.salePrice);
      const discountedItemIds = [];
      let remaining = sets;

      for (const item of sorted) {
        if (remaining <= 0) break;
        const itemQty = item.quantity || 1;
        const qtyToMark = Math.min(itemQty, remaining);

        // Si el item completo recibe descuento, agregarlo
        if (qtyToMark === itemQty) {
          discountedItemIds.push(item.id);
        }
        remaining -= qtyToMark;
      }

      return discountedItemIds;
    }

    return [];
  };

  // Validar y calcular promociones aplicables
  const checkApplicablePromotions = async () => {
    if (cartItems.length === 0 || activePromotions.length === 0) {
      setAppliedPromotions([]);
      setPromotionValidations({});
      return;
    }

    const { validatePromotion } = await import('../services/firebaseService');
    const subtotal = calculateSubtotal();
    const clientPhone = selectedClient?.phone || '';

    const validPromotions = [];
    const validations = {};

    for (const promotion of activePromotions) {
      // Adaptar cart items para validatePromotion (necesita type: 'product')
      const adaptedCart = cartItems.map(item => ({
        ...item,
        type: 'product',
        productId: item.id,
        price: item.salePrice
      }));

      const result = await validatePromotion(promotion, adaptedCart, clientPhone, subtotal);

      // Guardar resultado de validación para mostrar razón si no aplica
      validations[promotion.id] = {
        isValid: result.isValid,
        reason: result.reason || '',
        discountAmount: result.discountAmount || 0
      };

      if (result.isValid && result.discountAmount > 0) {
        validPromotions.push({
          ...promotion,
          discountAmount: result.discountAmount
        });
      }
    }

    setAppliedPromotions(validPromotions);
    setPromotionValidations(validations);
  };

  // Calcular total de descuentos de promociones
  const calculatePromotionDiscount = () => {
    return appliedPromotions.reduce((total, promo) => total + (promo.discountAmount || 0), 0);
  };

  // ========== FIN FUNCIONES DE PROMOCIONES ==========

  // ========== USEEFFECTS DE PROMOCIONES ==========

  // Filtrar solo promociones activas (mismo filtro que getActivePromotions)
  const activePromotions = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    return allPromotions.filter(promo => {
      // Verificar isActive
      if (!promo.isActive) return false;

      // Verificar rango de fechas
      if (promo.dateRange) {
        const startDate = promo.dateRange.startDate?.split('T')[0];
        const endDate = promo.dateRange.endDate?.split('T')[0];
        if (startDate && today < startDate) return false;
        if (endDate && today > endDate) return false;
      }

      // Verificar máximo de usos
      if (promo.maxUses && promo.currentUses >= promo.maxUses) return false;

      return true;
    });
  }, [allPromotions]);

  // Recalcular promociones cuando cambie el carrito o el cliente
  useEffect(() => {
    checkApplicablePromotions();
  }, [cartItems, selectedClient, activePromotions]);

  // ========== FIN USEEFFECTS DE PROMOCIONES ==========

  // Agregar producto al carrito
  const addProduct = (product, quantity = 1) => {
    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.id === product.id);

      if (existingItemIndex > -1) {
        // Si el producto ya existe, incrementar cantidad
        const newItems = [...prevItems];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + quantity
        };
        return newItems;
      } else {
        // Si es nuevo, agregarlo
        return [...prevItems, {
          id: product.id,
          name: product.name,
          barcode: product.barcode,
          salePrice: product.salePrice,
          purchasePrice: product.purchasePrice,
          emoji: product.emoji || '📦',
          stock: product.stock,
          quantity: quantity,
          images: product.images || []
        }];
      }
    });
    setIsCartOpen(true); // Abrir carrito automáticamente
  };

  // Eliminar producto del carrito
  const removeProduct = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  // Actualizar cantidad de un producto
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeProduct(productId);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  // Aplicar descuento
  const applyDiscount = (value, type = 'amount') => {
    setDiscount(value);
    setDiscountType(type);
  };

  // Limpiar todo el carrito
  const clearCart = () => {
    setCartItems([]);
    setDiscount(0);
    setDiscountType('amount');
    setNotes('');
    setSelectedClient(null);
    // Limpiar estados de promociones
    setAppliedPromotions([]);
    setPromotionValidations({});
    // Carrito permanece abierto después de vaciarse
  };

  // Calcular subtotal
  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.salePrice * item.quantity), 0);
  };

  // Calcular descuento en dinero
  const calculateDiscountAmount = () => {
    // Si hay promociones aplicadas, usar descuentos de promociones
    if (appliedPromotions.length > 0) {
      return calculatePromotionDiscount();
    }

    // Si no hay promociones, usar descuento manual
    const subtotal = calculateSubtotal();
    if (discountType === 'percentage') {
      return (subtotal * discount) / 100;
    }
    return discount;
  };

  // Calcular total
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = calculateDiscountAmount();
    return Math.max(0, subtotal - discountAmount);
  };

  // Contar items en el carrito
  const getItemCount = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  // Memoizar el mapa de items -> promoción asignada para optimizar performance
  const itemPromotionMap = useMemo(() => {
    const map = new Map();

    // Ordenar promociones por prioridad (específicas primero)
    const sortedPromotions = [...(appliedPromotions || [])].sort((a, b) =>
      getPromotionPriority(a) - getPromotionPriority(b)
    );

    // Asignar promociones a items según prioridad
    sortedPromotions.forEach(promo => {
      cartItems.forEach(item => {
        if (map.has(item.id)) return; // Ya tiene promo asignada

        // Verificar si esta promo aplica a este item
        let applies = false;

        switch (promo.type) {
          case 'percentage':
            if (promo.appliesTo === 'all') applies = true;
            else if (promo.appliesTo === 'products') applies = true;
            else if (promo.appliesTo === 'specific' && promo.specificItems) {
              applies = promo.specificItems.includes(item.id);
            }
            break;

          case 'fixed':
            if (!promo.applicableItems || promo.applicableItems.length === 0) {
              applies = true;
            } else {
              applies = promo.applicableItems.includes(item.id);
            }
            break;

          case 'buyXgetY':
          case 'buyXgetYdiscount':
            const itemsWithBadge = getItemsWithPromoBadge(promo, cartItems, map);
            applies = itemsWithBadge.includes(item.id);
            break;

          case 'combo':
            if (promo.comboItems) {
              applies = promo.comboItems.some(comboItem => comboItem.id === item.id);
            }
            break;

          case 'dayOfWeek':
            applies = true;
            break;
        }

        if (applies) {
          map.set(item.id, promo);
        }
      });
    });

    return map;
  }, [appliedPromotions, cartItems]);

  // Memoizar cálculos para evitar recalcular en cada render
  const subtotal = useMemo(() => calculateSubtotal(), [cartItems]);
  const discountAmount = useMemo(() => calculateDiscountAmount(), [discount, discountType, cartItems, appliedPromotions]);
  const total = useMemo(() => calculateTotal(), [cartItems, discount, discountType, appliedPromotions]);
  const itemCount = useMemo(() => getItemCount(), [cartItems]);

  const value = {
    cartItems,
    discount,
    discountType,
    notes,
    isCartOpen,
    selectedClient,
    setNotes,
    setIsCartOpen,
    setSelectedClient,
    addProduct,
    removeProduct,
    updateQuantity,
    applyDiscount,
    clearCart,
    subtotal,
    discountAmount,
    total,
    itemCount,
    // Estados y funciones de promociones
    activePromotions,
    appliedPromotions,
    promotionValidations,
    isPromotionRelevantForCart,
    itemPromotionMap
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
