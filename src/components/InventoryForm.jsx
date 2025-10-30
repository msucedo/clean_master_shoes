import { useState, useEffect } from 'react';
import { useAdminCheck } from '../contexts/AuthContext';
import ImageUpload from './ImageUpload';
import './InventoryForm.css';

const InventoryForm = ({ onSubmit, onCancel, onDelete, initialData }) => {
  const isAdmin = useAdminCheck();
  const [formData, setFormData] = useState({
    name: '',
    category: 'Tenis',
    description: '',
    sku: '',
    barcode: '',
    emoji: '📦',
    purchasePrice: '',
    salePrice: '',
    stock: '',
    minStock: '',
    images: []
  });

  const [errors, setErrors] = useState({});

  const categories = ['Tenis', 'Zapatos', 'Botas', 'Accesorios', 'Gorras', 'Bolsas'];

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        category: initialData.category || 'Tenis',
        description: initialData.description || '',
        sku: initialData.sku || '',
        barcode: initialData.barcode || '',
        emoji: initialData.emoji || '📦',
        purchasePrice: initialData.purchasePrice || '',
        salePrice: initialData.salePrice || '',
        stock: initialData.stock || '',
        minStock: initialData.minStock || '',
        images: initialData.images || []
      });
    }
  }, [initialData]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.category) {
      newErrors.category = 'La categoría es requerida';
    }

    if (!formData.sku.trim()) {
      newErrors.sku = 'El SKU es requerido';
    }

    if (formData.purchasePrice === '' || isNaN(formData.purchasePrice) || parseFloat(formData.purchasePrice) < 0) {
      newErrors.purchasePrice = 'El precio de compra debe ser un número positivo';
    }

    if (formData.salePrice === '' || isNaN(formData.salePrice) || parseFloat(formData.salePrice) < 0) {
      newErrors.salePrice = 'El precio de venta debe ser un número positivo';
    }

    if (parseFloat(formData.salePrice) < parseFloat(formData.purchasePrice)) {
      newErrors.salePrice = 'El precio de venta debe ser mayor al precio de compra';
    }

    if (formData.stock === '' || isNaN(formData.stock) || parseInt(formData.stock) < 0) {
      newErrors.stock = 'El stock debe ser un número positivo';
    }

    if (formData.minStock === '' || isNaN(formData.minStock) || parseInt(formData.minStock) < 0) {
      newErrors.minStock = 'El stock mínimo debe ser un número positivo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleImagesChange = (newImages) => {
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Convert numeric fields to numbers
      const submitData = {
        ...formData,
        purchasePrice: parseFloat(formData.purchasePrice),
        salePrice: parseFloat(formData.salePrice),
        stock: parseInt(formData.stock),
        minStock: parseInt(formData.minStock)
      };
      onSubmit(submitData);
    }
  };

  const handleDelete = () => {
    if (initialData && initialData.id) {
      onDelete(initialData.id);
    }
  };

  const calculateProfit = () => {
    const purchase = parseFloat(formData.purchasePrice) || 0;
    const sale = parseFloat(formData.salePrice) || 0;
    const profit = sale - purchase;
    const percentage = purchase > 0 ? ((profit / purchase) * 100).toFixed(1) : 0;
    return { profit, percentage };
  };

  const { profit, percentage } = calculateProfit();

  return (
    <form className="inventory-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        {/* Nombre */}
        <div className="form-group full-width">
          <label htmlFor="name">Nombre del Producto *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={errors.name ? 'error' : ''}
            placeholder="Ej: Tenis Nike Air Max"
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
        </div>

        {/* Categoría */}
        <div className="form-group">
          <label htmlFor="category">Categoría *</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={errors.category ? 'error' : ''}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.category && <span className="error-message">{errors.category}</span>}
        </div>

        {/* SKU */}
        <div className="form-group">
          <label htmlFor="sku">SKU (Código Interno) *</label>
          <input
            type="text"
            id="sku"
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            className={errors.sku ? 'error' : ''}
            placeholder="Ej: TNK-001"
          />
          {errors.sku && <span className="error-message">{errors.sku}</span>}
        </div>

        {/* Código de Barras */}
        <div className="form-group">
          <label htmlFor="barcode">Código de Barras</label>
          <input
            type="text"
            id="barcode"
            name="barcode"
            value={formData.barcode}
            onChange={handleChange}
            placeholder="Ej: 1234567890123"
          />
        </div>

        {/* Emoji */}
        <div className="form-group">
          <label htmlFor="emoji">Emoji del Producto</label>
          <input
            type="text"
            id="emoji"
            name="emoji"
            value={formData.emoji}
            onChange={handleChange}
            placeholder="📦"
            maxLength="2"
          />
          <span className="emoji-preview">{formData.emoji || '📦'}</span>
        </div>

        {/* Precio de Compra */}
        <div className="form-group">
          <label htmlFor="purchasePrice">Precio de Compra *</label>
          <input
            type="number"
            id="purchasePrice"
            name="purchasePrice"
            value={formData.purchasePrice}
            onChange={handleChange}
            className={errors.purchasePrice ? 'error' : ''}
            placeholder="0.00"
            step="0.01"
            min="0"
          />
          {errors.purchasePrice && <span className="error-message">{errors.purchasePrice}</span>}
        </div>

        {/* Precio de Venta */}
        <div className="form-group">
          <label htmlFor="salePrice">Precio de Venta *</label>
          <input
            type="number"
            id="salePrice"
            name="salePrice"
            value={formData.salePrice}
            onChange={handleChange}
            className={errors.salePrice ? 'error' : ''}
            placeholder="0.00"
            step="0.01"
            min="0"
          />
          {errors.salePrice && <span className="error-message">{errors.salePrice}</span>}
        </div>

        {/* Ganancia Calculada */}
        {formData.purchasePrice && formData.salePrice && (
          <div className="form-group profit-display">
            <label>Ganancia</label>
            <div className={`profit-value ${profit >= 0 ? 'positive' : 'negative'}`}>
              ${profit.toFixed(2)} ({percentage}%)
            </div>
          </div>
        )}

        {/* Stock Actual */}
        <div className="form-group">
          <label htmlFor="stock">Stock Actual *</label>
          <input
            type="number"
            id="stock"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            className={errors.stock ? 'error' : ''}
            placeholder="0"
            min="0"
          />
          {errors.stock && <span className="error-message">{errors.stock}</span>}
        </div>

        {/* Stock Mínimo */}
        <div className="form-group">
          <label htmlFor="minStock">Stock Mínimo *</label>
          <input
            type="number"
            id="minStock"
            name="minStock"
            value={formData.minStock}
            onChange={handleChange}
            className={errors.minStock ? 'error' : ''}
            placeholder="0"
            min="0"
          />
          {errors.minStock && <span className="error-message">{errors.minStock}</span>}
        </div>

        {/* Descripción */}
        <div className="form-group full-width">
          <label htmlFor="description">Descripción</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Descripción del producto..."
            rows="3"
          />
        </div>

        {/* Imágenes */}
        <div className="form-group full-width">
          <label>Imágenes del Producto</label>
          <ImageUpload
            images={formData.images}
            onChange={handleImagesChange}
          />
        </div>
      </div>

      <div className="form-actions">
        <div className="form-actions-left">
          {initialData && isAdmin && (
            <button
              type="button"
              className="btn-delete"
              onClick={handleDelete}
            >
              Eliminar Producto
            </button>
          )}
        </div>
        <div className="form-actions-right">
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" className="btn-submit">
            {initialData ? 'Guardar Cambios' : 'Agregar Producto'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default InventoryForm;
