import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getAllCashRegisterClosures } from '../services/firebaseService';
import { useNotification } from '../contexts/NotificationContext';
import CashClosureHistorySkeleton from './CashClosureHistorySkeleton';
import './CashClosureHistory.css';

const CashClosureHistory = ({ onViewDetails }) => {
  const { showError } = useNotification();
  const [closures, setClosures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadClosures();
  }, []);

  const loadClosures = async () => {
    try {
      setLoading(true);
      const data = await getAllCashRegisterClosures();
      setClosures(data);
    } catch (error) {
      console.error('Error loading closures:', error);
      showError('Error al cargar el historial de cortes');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getPeriodLabel = (periodo) => {
    const labels = {
      hoy: 'Hoy',
      semana: 'Semana',
      mes: 'Mes',
      año: 'Año'
    };
    return labels[periodo.tipo] || periodo.tipo;
  };

  const filteredClosures = closures.filter(closure => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      closure.autor?.nombre.toLowerCase().includes(search) ||
      getPeriodLabel(closure.periodo).toLowerCase().includes(search) ||
      formatDate(closure.fechaCorte).toLowerCase().includes(search)
    );
  });

  if (loading) {
    return <CashClosureHistorySkeleton />;
  }

  if (closures.length === 0) {
    return (
      <div className="ch-empty">
        <div className="ch-empty-icon">📋</div>
        <h3 className="ch-empty-title">No hay cortes registrados</h3>
        <p className="ch-empty-text">Los cortes de caja cerrados aparecerán aquí</p>
      </div>
    );
  }

  return (
    <div className="cash-closure-history">
      {/* Search Bar */}
      <div className="ch-search-bar">
        <input
          type="text"
          className="ch-search-input"
          placeholder="Buscar por empleado, periodo o fecha..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="ch-results-count">
          {filteredClosures.length} {filteredClosures.length === 1 ? 'corte' : 'cortes'}
        </div>
      </div>

      {/* Table */}
      <div className="ch-table-wrapper">
        <table className="ch-table">
          <thead>
            <tr>
              <th>Fecha del Corte</th>
              <th>Periodo</th>
              <th>Realizado por</th>
              <th>Total Ingresos del Día</th>
              <th>Total Ingresos de Este Corte</th>
              <th>Total Gastos</th>
              <th>Total Retiros</th>
              <th>Efectivo Final</th>
              <th>Órdenes</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredClosures.map((closure) => (
              <tr key={closure.id} className="ch-row">
                <td className="ch-date">{formatDate(closure.fechaCorte)}</td>
                <td>
                  <span className="ch-period-badge">
                    {getPeriodLabel(closure.periodo)}
                  </span>
                </td>
                <td className="ch-author">{closure.autor?.nombre || 'N/A'}</td>
                <td className="ch-income">{formatCurrency(closure.resultados?.ingresosTotal || 0)}</td>
                <td className="ch-income">{formatCurrency(closure.conteoIngresos?.totalGeneral || 0)}</td>
                <td className="ch-expenses">{formatCurrency(closure.gastos.total)}</td>
                <td className="ch-expenses">{formatCurrency(closure.retiros?.total || 0)}</td>
                <td className={`ch-final ${(() => {
                  // Usar efectivoFinal si existe, sino calcular (para compatibilidad con cortes antiguos)
                  const efectivoFinal = closure.efectivoFinal !== undefined
                    ? closure.efectivoFinal
                    : (closure.conteoIngresos?.efectivo?.total || 0) - (closure.gastos?.total || 0);
                  return efectivoFinal >= 0 ? 'positive' : 'negative';
                })()}`}>
                  {formatCurrency((() => {
                    // Usar efectivoFinal si existe, sino calcular (para compatibilidad con cortes antiguos)
                    return closure.efectivoFinal !== undefined
                      ? closure.efectivoFinal
                      : (closure.conteoIngresos?.efectivo?.total || 0) - (closure.gastos?.total || 0);
                  })())}
                </td>
                <td className="ch-orders">
                  {closure.totalOrdenes}
                  {(closure.totalOrdenes === 0 || closure.diferencias?.total !== 0) && (
                    <span className="ch-flexible-badge" title="Corte guardado sin validación completa">
                      ⚠️
                    </span>
                  )}
                </td>
                <td>
                  <button
                    className="ch-btn-view"
                    onClick={() => onViewDetails(closure)}
                    title="Ver detalles"
                  >
                    👁️ Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredClosures.length === 0 && searchTerm && (
        <div className="ch-no-results">
          <div className="ch-no-results-icon">🔍</div>
          <div className="ch-no-results-text">
            No se encontraron cortes que coincidan con "{searchTerm}"
          </div>
        </div>
      )}
    </div>
  );
};

CashClosureHistory.propTypes = {
  onViewDetails: PropTypes.func.isRequired
};

export default CashClosureHistory;
