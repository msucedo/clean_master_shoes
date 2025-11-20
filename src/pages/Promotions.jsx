import { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import PromotionForm from '../components/PromotionForm';
import PromotionCard from '../components/PromotionCard';
import PageHeader from '../components/PageHeader';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  subscribeToPromotions,
  subscribeToServices,
  subscribeToInventory,
  addPromotion,
  updatePromotion,
  deletePromotion
} from '../services/firebaseService';
import { useNotification } from '../contexts/NotificationContext';
import { useAdminCheck } from '../contexts/AuthContext';
import './Promotions.css';

const Promotions = () => {
  const { showSuccess, showError } = useNotification();
  const isAdmin = useAdminCheck();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [promotions, setPromotions] = useState([]);
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'default'
  });

  // Subscribe to promotions
  useEffect(() => {
    setLoading(true);

    const unsubscribe = subscribeToPromotions((promotionsData) => {
      setPromotions(promotionsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to services (for form)
  useEffect(() => {
    const unsubscribe = subscribeToServices((servicesData) => {
      setServices(servicesData);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to inventory (for form)
  useEffect(() => {
    const unsubscribe = subscribeToInventory((inventoryData) => {
      setProducts(inventoryData);
    });

    return () => unsubscribe();
  }, []);

  // Filter promotions
  const filteredPromotions = promotions.filter(promotion => {
    // Search filter
    const matchesSearch =
      promotion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promotion.description.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Status filter
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') {
      if (!promotion.isActive) return false;

      // Comparar solo fechas (sin hora) para evitar problemas de timezone
      const today = new Date().toISOString().split('T')[0];

      // Check date range
      if (promotion.dateRange) {
        const { startDate, endDate } = promotion.dateRange;
        const promotionStartDate = startDate ? startDate.split('T')[0] : null;
        const promotionEndDate = endDate ? endDate.split('T')[0] : null;

        if (promotionStartDate && today < promotionStartDate) return false;
        if (promotionEndDate && today > promotionEndDate) return false;
      }

      // Check max uses
      if (promotion.maxUses && promotion.currentUses >= promotion.maxUses) {
        return false;
      }

      return true;
    }

    if (filterStatus === 'inactive') {
      return !promotion.isActive;
    }

    return true;
  });

  const handleAddPromotion = () => {
    if (!isAdmin) {
      showError('Solo los administradores pueden agregar promociones');
      return;
    }

    setSelectedPromotion(null);
    setIsModalOpen(true);
  };

  const handleEditPromotion = (promotion) => {
    if (!isAdmin) {
      showError('Solo los administradores pueden editar promociones');
      return;
    }

    setSelectedPromotion(promotion);
    setIsModalOpen(true);
  };

  const handleDeletePromotion = (promotion) => {
    if (!isAdmin) {
      showError('Solo los administradores pueden eliminar promociones');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Promoción',
      message: `¿Estás seguro de que deseas eliminar la promoción "${promotion.name}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        try {
          await deletePromotion(promotion.id);
          showSuccess('Promoción eliminada correctamente');
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (error) {
          console.error('Error deleting promotion:', error);
          showError('Error al eliminar la promoción');
        }
      },
      type: 'danger'
    });
  };

  const handleSubmit = async (promotionData) => {
    try {
      if (selectedPromotion) {
        // Update existing promotion
        await updatePromotion(selectedPromotion.id, promotionData);
        showSuccess('Promoción actualizada correctamente');
      } else {
        // Create new promotion
        await addPromotion(promotionData);
        showSuccess('Promoción creada correctamente');
      }
      setIsModalOpen(false);
      setSelectedPromotion(null);
    } catch (error) {
      console.error('Error saving promotion:', error);
      showError('Error al guardar la promoción');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPromotion(null);
  };

  // Get stats
  const stats = {
    total: promotions.length,
    active: promotions.filter(p => {
      if (!p.isActive) return false;
      // Comparar solo fechas (sin hora) para evitar problemas de timezone
      const today = new Date().toISOString().split('T')[0];
      const endDate = p.dateRange?.endDate ? p.dateRange.endDate.split('T')[0] : null;
      if (endDate && today > endDate) return false;
      if (p.maxUses && p.currentUses >= p.maxUses) return false;
      return true;
    }).length,
    inactive: promotions.filter(p => !p.isActive).length
  };

  return (
    <div className="promotions-page">
      <PageHeader
        title="Promociones"
        buttonLabel="Agregar Promoción"
        buttonIcon="➕"
        onButtonClick={handleAddPromotion}
        showSearch={true}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* Stats */}
      <div className="promotions-stats">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-value active">{stats.active}</div>
          <div className="stat-label">Activas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value inactive">{stats.inactive}</div>
          <div className="stat-label">Inactivas</div>
        </div>
      </div>

      {/* Filters */}
      <div className="promotions-filters">
        <button
          className={`filter-button ${filterStatus === 'all' ? 'active' : ''}`}
          onClick={() => setFilterStatus('all')}
        >
          Todas
        </button>
        <button
          className={`filter-button ${filterStatus === 'active' ? 'active' : ''}`}
          onClick={() => setFilterStatus('active')}
        >
          Activas
        </button>
        <button
          className={`filter-button ${filterStatus === 'inactive' ? 'active' : ''}`}
          onClick={() => setFilterStatus('inactive')}
        >
          Inactivas
        </button>
      </div>

      {/* Promotions Grid */}
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Cargando promociones...</p>
        </div>
      ) : filteredPromotions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎉</div>
          <h3>No hay promociones</h3>
          <p>
            {searchTerm
              ? 'No se encontraron promociones con ese término de búsqueda'
              : 'Crea tu primera promoción para empezar a ofrecer descuentos a tus clientes'}
          </p>
          {!searchTerm && isAdmin && (
            <button className="btn-primary" onClick={handleAddPromotion}>
              ➕ Crear Promoción
            </button>
          )}
        </div>
      ) : (
        <div className="promotions-grid">
          {filteredPromotions.map(promotion => (
            <PromotionCard
              key={promotion.id}
              promotion={promotion}
              onEdit={handleEditPromotion}
              onDelete={handleDeletePromotion}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedPromotion ? 'Editar Promoción' : 'Nueva Promoción'}
        size="large"
      >
        <PromotionForm
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          onDelete={handleDeletePromotion}
          initialData={selectedPromotion}
          services={services}
          products={products}
        />
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        type={confirmDialog.type}
      />
    </div>
  );
};

export default Promotions;
