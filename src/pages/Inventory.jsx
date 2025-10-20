import { useState, useEffect } from 'react';
import InventoryCard from '../components/InventoryCard';
import Modal from '../components/Modal';
import InventoryForm from '../components/InventoryForm';
import PageHeader from '../components/PageHeader';
import {
  subscribeToInventory,
  addProduct,
  updateProduct,
  deleteProduct
} from '../services/firebaseService';
import './Inventory.css';

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const categories = ['Tenis', 'Zapatos', 'Botas', 'Accesorios', 'Gorras', 'Bolsas'];

  // Subscribe to real-time inventory updates
  useEffect(() => {
    setLoading(true);

    const unsubscribe = subscribeToInventory((productsData) => {
      setProducts(productsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filterProducts = (productsList) => {
    let filtered = productsList;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.barcode && product.barcode.includes(searchTerm)) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    // Apply stock filter
    if (stockFilter === 'low') {
      filtered = filtered.filter(product => product.stock <= product.minStock);
    } else if (stockFilter === 'available') {
      filtered = filtered.filter(product => product.stock > product.minStock);
    }

    return filtered;
  };

  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmitProduct = async (formData) => {
    try {
      if (editingProduct) {
        // Edit existing product
        await updateProduct(editingProduct.id, formData);
      } else {
        // Create new product
        await addProduct(formData);
      }
      handleCloseModal();
      // Real-time listener will update the UI automatically
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error al guardar el producto');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (confirm('¿Estás seguro de eliminar este producto del inventario?')) {
      try {
        await deleteProduct(productId);
        handleCloseModal();
        // Real-time listener will update the UI automatically
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error al eliminar el producto');
      }
    }
  };

  const filteredProducts = filterProducts(products);

  // Calculate inventory stats
  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;
  const totalValue = products.reduce((sum, p) => sum + (p.salePrice * p.stock), 0);

  return (
    <div className="inventory-page">
      {/* Header */}
      <PageHeader
        title="Inventario"
        buttonLabel="Agregar Producto"
        buttonIcon="➕"
        onButtonClick={handleOpenNewProduct}
        showSearch={true}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por nombre, SKU o código de barras..."
        filters={[
          {
            label: 'Todas',
            onClick: () => setCategoryFilter('all'),
            active: categoryFilter === 'all'
          },
          ...categories.map(cat => ({
            label: cat,
            onClick: () => setCategoryFilter(cat),
            active: categoryFilter === cat
          }))
        ]}
      />

      {/* Inventory Stats */}
      <div className="inventory-stats">
        <div className="stat-item">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <div className="stat-value">{totalProducts}</div>
            <div className="stat-label">Total Productos</div>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-value">{lowStockCount}</div>
            <div className="stat-label">Stock Bajo</div>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">${totalValue.toFixed(2)}</div>
            <div className="stat-label">Valor Total</div>
          </div>
        </div>
      </div>

      {/* Stock Filter */}
      <div className="stock-filters">
        <button
          className={`stock-filter-btn ${stockFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStockFilter('all')}
        >
          Todos
        </button>
        <button
          className={`stock-filter-btn ${stockFilter === 'available' ? 'active' : ''}`}
          onClick={() => setStockFilter('available')}
        >
          Disponible
        </button>
        <button
          className={`stock-filter-btn ${stockFilter === 'low' ? 'active' : ''}`}
          onClick={() => setStockFilter('low')}
        >
          Stock Bajo
        </button>
      </div>

      {/* Products Grid */}
      <div className="inventory-grid">
        {loading ? (
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <div className="empty-text">Cargando inventario...</div>
          </div>
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <InventoryCard
              key={product.id}
              product={product}
              onClick={(prod) => {
                setEditingProduct(prod);
                setIsModalOpen(true);
              }}
            />
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <div className="empty-text">No se encontraron productos</div>
            <div className="empty-subtext">
              {products.length === 0 && searchTerm === '' && categoryFilter === 'all' && stockFilter === 'all'
                ? 'Agrega tu primer producto al inventario'
                : 'Intenta ajustar tus filtros o búsqueda'}
            </div>
          </div>
        )}
      </div>

      {/* Modal for New/Edit Product */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
        size="large"
      >
        <InventoryForm
          onSubmit={handleSubmitProduct}
          onCancel={handleCloseModal}
          onDelete={handleDeleteProduct}
          initialData={editingProduct}
        />
      </Modal>
    </div>
  );
};

export default Inventory;
