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
    let date;
    // Si es formato YYYY-MM-DD (sin hora), parsear como local
    if (dateString && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-');
      date = new Date(year, month - 1, day);
      // Para fechas sin hora, solo mostrar fecha
      return new Intl.DateTimeFormat('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    } else {
      // Para timestamps completos (con hora), usar el constructor normal
      date = new Date(dateString);
      return new Intl.DateTimeFormat('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    }
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
              <div className="ccd-stat-label">Total Ingresos + Dinero inicial en caja</div>
              <div className="ccd-stat-value">{formatCurrency(closure.dineroEnSistema?.total || 0)}</div>
            </div>
          </div>

          <div className="ccd-stat-card">
            <div className="ccd-stat-icon">💵</div>
            <div className="ccd-stat-info">
              <div className="ccd-stat-label">Ingresos de Efectivo + Dinero inicial en caja</div>
              <div className="ccd-stat-value">{formatCurrency(closure.dineroEnSistema?.efectivo || 0)}</div>
            </div>
          </div>

          <div className="ccd-stat-card">
            <div className="ccd-stat-icon">💳</div>
            <div className="ccd-stat-info">
              <div className="ccd-stat-label">Ingresos de Tarjeta</div>
              <div className="ccd-stat-value">{formatCurrency(closure.dineroEnSistema?.tarjeta || 0)}</div>
            </div>
          </div>

          <div className="ccd-stat-card">
            <div className="ccd-stat-icon">🏦</div>
            <div className="ccd-stat-info">
              <div className="ccd-stat-label">Ingresos de Transferencia</div>
              <div className="ccd-stat-value">{formatCurrency(closure.dineroEnSistema?.transferencia || 0)}</div>
            </div>
          </div>

          <div className="ccd-stat-card">
            <div className="ccd-stat-icon">📦</div>
            <div className="ccd-stat-info">
              <div className="ccd-stat-label">Órdenes</div>
              <div className="ccd-stat-value">{closure.totalOrdenes}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteo de Ingresos */}
      <div className="ccd-section">
        <h3 className="ccd-section-title">📊 Conteo de Ingresos</h3>

        {/* Dinero Inicial */}
        {closure.dineroInicial !== undefined && (
          <div className="ccd-subsection">
            <h4 className="ccd-subsection-title">💰 Dinero Inicial en Caja</h4>
            <div className="ccd-value-display">
              {formatCurrency(closure.dineroInicial)}
            </div>
          </div>
        )}

        {/* Efectivo */}
        {closure.conteoIngresos && closure.conteoIngresos.efectivo && (
          <div className="ccd-subsection">
            <h4 className="ccd-subsection-title">💵 Efectivo (Órdenes + caja inicial)</h4>

            {/* Billetes */}
            {closure.conteoIngresos.efectivo.billetes && (
              <div className="ccd-denomination-group">
                <h5 className="ccd-group-label">Billetes</h5>
                <div className="ccd-bill-list">
                  {Object.entries(closure.conteoIngresos.efectivo.billetes).map(([denom, cant]) => (
                    cant > 0 && (
                      <div key={denom} className="ccd-bill-item">
                        <span>💵 ${denom}</span>
                        <span className="ccd-bill-calc">
                          {cant} × ${denom} = {formatCurrency(parseFloat(denom) * cant)}
                        </span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Monedas */}
            {closure.conteoIngresos.efectivo.monedas && (
              <div className="ccd-denomination-group">
                <h5 className="ccd-group-label">Monedas</h5>
                <div className="ccd-bill-list">
                  {Object.entries(closure.conteoIngresos.efectivo.monedas).map(([denom, cant]) => (
                    cant > 0 && (
                      <div key={denom} className="ccd-bill-item">
                        <span>🪙 ${denom}</span>
                        <span className="ccd-bill-calc">
                          {cant} × ${denom} = {formatCurrency(parseFloat(denom) * cant)}
                        </span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            <div className="ccd-subtotal">
              <span>Total Efectivo:</span>
              <span>{formatCurrency(closure.conteoIngresos.efectivo.total)}</span>
            </div>
          </div>
        )}

        {/* Tarjeta */}
        {closure.conteoIngresos && closure.conteoIngresos.tarjeta && (
          <div className="ccd-subsection">
            <h4 className="ccd-subsection-title">💳 Tarjeta (Terminal/TPV)</h4>
            {closure.conteoIngresos.tarjeta.cobros && closure.conteoIngresos.tarjeta.cobros.length > 0 && (
              <div className="ccd-payments-list">
                {closure.conteoIngresos.tarjeta.cobros.map((monto, index) => (
                  monto > 0 && (
                    <div key={index} className="ccd-payment-item">
                      <span>Cobro #{index + 1}:</span>
                      <span>{formatCurrency(monto)}</span>
                    </div>
                  )
                ))}
              </div>
            )}
            <div className="ccd-subtotal">
              <span>Total Tarjeta:</span>
              <span>{formatCurrency(closure.conteoIngresos.tarjeta.total)}</span>
            </div>
          </div>
        )}

        {/* Transferencia */}
        {closure.conteoIngresos && closure.conteoIngresos.transferencia && (
          <div className="ccd-subsection">
            <h4 className="ccd-subsection-title">🏦 Transferencia (Banco/App)</h4>
            {closure.conteoIngresos.transferencia.transferencias && closure.conteoIngresos.transferencia.transferencias.length > 0 && (
              <div className="ccd-payments-list">
                {closure.conteoIngresos.transferencia.transferencias.map((monto, index) => (
                  monto > 0 && (
                    <div key={index} className="ccd-payment-item">
                      <span>Transferencia #{index + 1}:</span>
                      <span>{formatCurrency(monto)}</span>
                    </div>
                  )
                ))}
              </div>
            )}
            <div className="ccd-subtotal">
              <span>Total Transferencia:</span>
              <span>{formatCurrency(closure.conteoIngresos.transferencia.total)}</span>
            </div>
          </div>
        )}

        {/* Total Conteo */}
        {closure.conteoIngresos && closure.conteoIngresos.totalGeneral !== undefined && (
          <div className="ccd-total">
            <span>💰 TOTAL CONTEO DE INGRESOS:</span>
            <span>{formatCurrency(closure.conteoIngresos.totalGeneral)}</span>
          </div>
        )}
      </div>

      {/* Dinero en Sistema */}
      {closure.dineroEnSistema && (
        <div className="ccd-section">
          <h3 className="ccd-section-title">💻 Dinero en Caja (Sistema)</h3>
          <div className="ccd-comparison-list">
            <div className="ccd-comparison-item">
              <span className="ccd-comp-label">💵 Efectivo:</span>
              <span className="ccd-comp-amount">{formatCurrency(closure.dineroEnSistema.efectivo)}</span>
              {closure.diferencias && (
                <span className={`ccd-comp-diff ${closure.diferencias.efectivo >= 0 ? 'positive' : 'negative'}`}>
                  {closure.diferencias.efectivo >= 0 ? '+' : ''}{formatCurrency(closure.diferencias.efectivo)}
                </span>
              )}
            </div>
            <div className="ccd-comparison-item">
              <span className="ccd-comp-label">💳 Tarjeta:</span>
              <span className="ccd-comp-amount">{formatCurrency(closure.dineroEnSistema.tarjeta)}</span>
              {closure.diferencias && (
                <span className={`ccd-comp-diff ${closure.diferencias.tarjeta >= 0 ? 'positive' : 'negative'}`}>
                  {closure.diferencias.tarjeta >= 0 ? '+' : ''}{formatCurrency(closure.diferencias.tarjeta)}
                </span>
              )}
            </div>
            <div className="ccd-comparison-item">
              <span className="ccd-comp-label">🏦 Transferencia:</span>
              <span className="ccd-comp-amount">{formatCurrency(closure.dineroEnSistema.transferencia)}</span>
              {closure.diferencias && (
                <span className={`ccd-comp-diff ${closure.diferencias.transferencia >= 0 ? 'positive' : 'negative'}`}>
                  {closure.diferencias.transferencia >= 0 ? '+' : ''}{formatCurrency(closure.diferencias.transferencia)}
                </span>
              )}
            </div>
            <div className="ccd-comparison-item total">
              <span className="ccd-comp-label">💰 Total:</span>
              <span className="ccd-comp-amount">{formatCurrency(closure.dineroEnSistema.total)}</span>
              {closure.diferencias && (
                <span className={`ccd-comp-diff ${closure.diferencias.total >= 0 ? 'positive' : 'negative'}`}>
                  {closure.diferencias.total >= 0 ? '+' : ''}{formatCurrency(closure.diferencias.total)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resultados */}
      {closure.resultados && (
        <div className="ccd-section">
          <h3 className="ccd-section-title">📈 Resultados</h3>
          <div className="ccd-results-grid">
            <div className="ccd-result-item">
              <div className="ccd-result-icon">💰</div>
              <div className="ccd-result-info">
                <div className="ccd-result-label">Ingresos Totales</div>
                <div className="ccd-result-value">{formatCurrency(closure.resultados.ingresosTotal)}</div>
              </div>
            </div>
            <div className="ccd-result-item">
              <div className="ccd-result-icon">📝</div>
              <div className="ccd-result-info">
                <div className="ccd-result-label">Gastos Totales</div>
                <div className="ccd-result-value expense">{formatCurrency(closure.resultados.gastosTotal)}</div>
              </div>
            </div>
            <div className="ccd-result-item highlight">
              <div className="ccd-result-icon">🎯</div>
              <div className="ccd-result-info">
                <div className="ccd-result-label">Ganancia del Día</div>
                <div className={`ccd-result-value ${closure.resultados.gananciaDia >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(closure.resultados.gananciaDia)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expenses */}
      <div className="ccd-section">
        <h3 className="ccd-section-title">📝 Gastos del Periodo</h3>
        <div className="ccd-expenses-summary">
          <div className="ccd-expense-total">
            Total Gastos: <span>{formatCurrency(closure.gastos.total)}</span>
          </div>
          <div className="ccd-expense-final">
            Ganancia del Día: <span className={(closure.resultados?.gananciaDia || 0) >= 0 ? 'positive' : 'negative'}>
              {formatCurrency(closure.resultados?.gananciaDia || 0)}
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
