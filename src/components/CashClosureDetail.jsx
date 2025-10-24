import PropTypes from 'prop-types';
import './CashClosureDetail.css';

const CashClosureDetail = ({ closure, onClose }) => {
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
      month: 'long',
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

  const getCategoryIcon = (category) => {
    const icons = {
      general: '📋',
      supplies: '🧴',
      salary: '💵',
      services: '💡',
      equipment: '🛠️',
      maintenance: '🔧',
      other: '📦'
    };
    return icons[category] || '📋';
  };

  const getCategoryLabel = (category) => {
    const labels = {
      general: 'General',
      supplies: 'Insumos',
      salary: 'Nómina',
      services: 'Servicios',
      equipment: 'Equipo',
      maintenance: 'Mantenimiento',
      other: 'Otro'
    };
    return labels[category] || 'General';
  };

  return (
    <div className="cash-closure-detail">
      {/* Header */}
      <div className="ccd-header">
        <div className="ccd-header-left">
          <h2 className="ccd-title">📊 Detalle del Corte de Caja</h2>
          <div className="ccd-subtitle">
            {formatDate(closure.fechaCorte)} • {getPeriodLabel(closure.periodo)}
          </div>
        </div>
        <button className="ccd-btn-close" onClick={onClose}>
          ✕
        </button>
      </div>

      {/* Author Info */}
      <div className="ccd-section ccd-author">
        <div className="ccd-author-icon">👤</div>
        <div className="ccd-author-info">
          <div className="ccd-author-label">Realizado por:</div>
          <div className="ccd-author-name">{closure.autor?.nombre || 'N/A'}</div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="ccd-section">
        <h3 className="ccd-section-title">💰 Resumen Financiero</h3>
        <div className="ccd-stats-grid">
          <div className="ccd-stat-card total">
            <div className="ccd-stat-icon">💵</div>
            <div className="ccd-stat-info">
              <div className="ccd-stat-label">Total Ingresos</div>
              <div className="ccd-stat-value">{formatCurrency(closure.ingresos.total)}</div>
            </div>
          </div>

          <div className="ccd-stat-card">
            <div className="ccd-stat-icon">💵</div>
            <div className="ccd-stat-info">
              <div className="ccd-stat-label">Efectivo</div>
              <div className="ccd-stat-value">{formatCurrency(closure.ingresos.efectivo)}</div>
            </div>
          </div>

          <div className="ccd-stat-card">
            <div className="ccd-stat-icon">💳</div>
            <div className="ccd-stat-info">
              <div className="ccd-stat-label">Tarjeta</div>
              <div className="ccd-stat-value">{formatCurrency(closure.ingresos.tarjeta)}</div>
            </div>
          </div>

          <div className="ccd-stat-card">
            <div className="ccd-stat-icon">🏦</div>
            <div className="ccd-stat-info">
              <div className="ccd-stat-label">Transferencia</div>
              <div className="ccd-stat-value">{formatCurrency(closure.ingresos.transferencia)}</div>
            </div>
          </div>

          <div className="ccd-stat-card">
            <div className="ccd-stat-icon">📦</div>
            <div className="ccd-stat-info">
              <div className="ccd-stat-label">Órdenes</div>
              <div className="ccd-stat-value">{closure.totalOrdenes}</div>
            </div>
          </div>

          <div className="ccd-stat-card">
            <div className="ccd-stat-icon">⚠️</div>
            <div className="ccd-stat-info">
              <div className="ccd-stat-label">Por Cobrar</div>
              <div className="ccd-stat-value">{formatCurrency(closure.saldoPorCobrar)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Count */}
      <div className="ccd-section">
        <h3 className="ccd-section-title">💵 Conteo de Efectivo</h3>
        <div className="ccd-cash-summary">
          <div className="ccd-cash-row">
            <span>Efectivo Esperado:</span>
            <span className="ccd-cash-amount">{formatCurrency(closure.efectivo.esperado)}</span>
          </div>
          <div className="ccd-cash-row">
            <span>Efectivo Contado:</span>
            <span className="ccd-cash-amount">{formatCurrency(closure.efectivo.contado)}</span>
          </div>
          <div className={`ccd-cash-row difference ${closure.efectivo.diferencia >= 0 ? 'positive' : 'negative'}`}>
            <span>Diferencia:</span>
            <span className="ccd-cash-amount">
              {closure.efectivo.diferencia >= 0 ? '+' : ''}{formatCurrency(closure.efectivo.diferencia)}
            </span>
          </div>
        </div>
      </div>

      {/* Expenses */}
      <div className="ccd-section">
        <h3 className="ccd-section-title">📝 Gastos del Periodo</h3>
        <div className="ccd-expenses-summary">
          <div className="ccd-expense-total">
            Total Gastos: <span>{formatCurrency(closure.gastos.total)}</span>
          </div>
          <div className="ccd-expense-final">
            Efectivo Final: <span className={closure.netoFinal >= 0 ? 'positive' : 'negative'}>
              {formatCurrency(closure.netoFinal)}
            </span>
          </div>
        </div>

        {closure.gastos.items && closure.gastos.items.length > 0 ? (
          <div className="ccd-expenses-list">
            {closure.gastos.items.map((expense, index) => (
              <div key={index} className="ccd-expense-item">
                <div className="ccd-expense-icon">{getCategoryIcon(expense.category)}</div>
                <div className="ccd-expense-info">
                  <div className="ccd-expense-concept">{expense.concept}</div>
                  <div className="ccd-expense-details">
                    {getCategoryLabel(expense.category)} • {formatDate(expense.date)}
                  </div>
                  {expense.notes && (
                    <div className="ccd-expense-notes">{expense.notes}</div>
                  )}
                </div>
                <div className="ccd-expense-amount">{formatCurrency(expense.amount)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="ccd-empty-state">
            No hubo gastos en este periodo
          </div>
        )}
      </div>

      {/* Notes */}
      {closure.notas && (
        <div className="ccd-section">
          <h3 className="ccd-section-title">📝 Notas</h3>
          <div className="ccd-notes">{closure.notas}</div>
        </div>
      )}

      {/* Footer */}
      <div className="ccd-footer">
        <div className="ccd-readonly-badge">
          🔒 Corte cerrado (solo lectura)
        </div>
      </div>
    </div>
  );
};

CashClosureDetail.propTypes = {
  closure: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired
};

export default CashClosureDetail;
