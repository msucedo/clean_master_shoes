import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';
import ExpenseForm from './ExpenseForm';
import ConfirmDialog from './ConfirmDialog';
import {
  addExpense,
  getExpensesByDateRange,
  deleteExpense,
  saveCashRegisterClosure,
  subscribeToEmployees
} from '../services/firebaseService';
import { useNotification } from '../contexts/NotificationContext';
import './CashRegister.css';

const CashRegister = ({ orders, dateFilter }) => {
  const { showSuccess, showError } = useNotification();

  const [expenses, setExpenses] = useState([]);
  const [cashCounted, setCashCounted] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employees, setEmployees] = useState([]);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  // Load employees
  useEffect(() => {
    const unsubscribe = subscribeToEmployees((employeesData) => {
      // Filter only active employees
      const activeEmployees = employeesData.filter(emp => emp.status === 'active');
      setEmployees(activeEmployees);
    });

    return () => unsubscribe();
  }, []);

  // Load expenses when date filter changes
  useEffect(() => {
    loadExpenses();
  }, [dateFilter]);

  const loadExpenses = async () => {
    try {
      const { startDate, endDate } = getDateRange();
      const expensesData = await getExpensesByDateRange(startDate, endDate);
      setExpenses(expensesData);
    } catch (error) {
      console.error('Error loading expenses:', error);
      showError('Error al cargar los gastos');
    }
  };

  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate;

    switch (dateFilter) {
      case 'Hoy':
        startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        endDate = new Date(now.setHours(23, 59, 59, 999)).toISOString();
        break;
      case 'Semana':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startDate = new Date(startOfWeek.setHours(0, 0, 0, 0)).toISOString();
        endDate = new Date().toISOString();
        break;
      case 'Mes':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
        break;
      case 'Año':
        startDate = new Date(now.getFullYear(), 0, 1).toISOString();
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString();
        break;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        endDate = new Date(now.setHours(23, 59, 59, 999)).toISOString();
    }

    return { startDate, endDate };
  };

  // Calculate financial summary
  const calculateSummary = () => {
    let totalIncome = 0;
    let cashIncome = 0;
    let cardIncome = 0;
    let transferIncome = 0;
    let totalOrders = 0;
    let pendingPayments = 0;

    orders.forEach(order => {
      const total = parseFloat(order.totalPrice) || 0;
      const advance = parseFloat(order.advancePayment) || 0;
      const remaining = total - advance;

      totalIncome += advance;
      totalOrders++;

      // Count by payment method
      if (order.paymentMethod === 'cash' && advance > 0) {
        cashIncome += advance;
      } else if (order.paymentMethod === 'card' && advance > 0) {
        cardIncome += advance;
      } else if (order.paymentMethod === 'transfer' && advance > 0) {
        transferIncome += advance;
      }

      // Pending payments
      if (order.paymentStatus === 'partial' || order.paymentStatus === 'pending') {
        pendingPayments += remaining;
      }
    });

    return {
      totalIncome,
      cashIncome,
      cardIncome,
      transferIncome,
      totalOrders,
      pendingPayments
    };
  };

  const summary = calculateSummary();

  // Calculate expenses total
  const totalExpenses = expenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);

  // Cash calculations
  const expectedCash = summary.cashIncome;
  const countedCash = parseFloat(cashCounted) || 0;
  const cashDifference = countedCash - expectedCash;
  const finalCash = countedCash - totalExpenses;

  const handleAddExpense = async (expenseData) => {
    try {
      await addExpense(expenseData);
      showSuccess('Gasto agregado exitosamente');
      setIsExpenseModalOpen(false);
      loadExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      showError('Error al agregar el gasto');
    }
  };

  const handleDeleteExpense = (expenseId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Gasto',
      message: '¿Estás seguro de que deseas eliminar este gasto? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        try {
          await deleteExpense(expenseId);
          showSuccess('Gasto eliminado');
          loadExpenses();
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (error) {
          console.error('Error deleting expense:', error);
          showError('Error al eliminar el gasto');
        }
      }
    });
  };

  const handleCloseCashRegister = () => {
    // Validate employee is selected
    if (!selectedEmployee) {
      showError('Por favor selecciona el empleado que realiza el corte');
      return;
    }

    const employee = employees.find(emp => emp.id === selectedEmployee);

    setConfirmDialog({
      isOpen: true,
      title: 'Cerrar Corte de Caja',
      message: `¿Deseas cerrar el corte de caja para el periodo "${dateFilter}"? Esta acción guardará el corte como solo lectura.`,
      onConfirm: async () => {
        try {
          const { startDate, endDate } = getDateRange();

          const closureData = {
            autor: {
              id: employee.id,
              nombre: employee.name
            },
            fechaCorte: new Date().toISOString(),
            periodo: {
              inicio: startDate,
              fin: endDate,
              tipo: dateFilter.toLowerCase()
            },
            ingresos: {
              total: summary.totalIncome,
              efectivo: summary.cashIncome,
              tarjeta: summary.cardIncome,
              transferencia: summary.transferIncome
            },
            efectivo: {
              esperado: expectedCash,
              contado: countedCash,
              diferencia: cashDifference
            },
            gastos: {
              items: expenses.map(e => ({ ...e })),
              total: totalExpenses
            },
            ordenes: orders.map(o => o.id),
            totalOrdenes: summary.totalOrders,
            netoFinal: finalCash,
            saldoPorCobrar: summary.pendingPayments,
            notas: notes
          };

          await saveCashRegisterClosure(closureData);
          showSuccess('Corte de caja cerrado exitosamente');

          // Reset form
          setCashCounted('');
          setNotes('');
          setSelectedEmployee('');

          setConfirmDialog({ ...confirmDialog, isOpen: false });
        } catch (error) {
          console.error('Error closing cash register:', error);
          showError('Error al cerrar el corte de caja');
        }
      }
    });
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
      day: 'numeric'
    }).format(date);
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      cash: 'Efectivo',
      card: 'Tarjeta',
      transfer: 'Transferencia',
      pending: 'Pendiente'
    };
    return labels[method] || method;
  };

  return (
    <div className="cash-register">
      {/* Financial Summary Section */}
      <div className="cr-section">
        <div className="cr-section-header">
          <h3>💰 Resumen Financiero</h3>
          <div className="cr-period-badge">{dateFilter}</div>
        </div>

        <div className="cr-stats-grid">
          <div className="cr-stat-card total">
            <div className="cr-stat-icon">💵</div>
            <div className="cr-stat-info">
              <div className="cr-stat-label">Total Ingresos</div>
              <div className="cr-stat-value">{formatCurrency(summary.totalIncome)}</div>
            </div>
          </div>

          <div className="cr-stat-card cash">
            <div className="cr-stat-icon">💵</div>
            <div className="cr-stat-info">
              <div className="cr-stat-label">Efectivo</div>
              <div className="cr-stat-value">{formatCurrency(summary.cashIncome)}</div>
            </div>
          </div>

          <div className="cr-stat-card card">
            <div className="cr-stat-icon">💳</div>
            <div className="cr-stat-info">
              <div className="cr-stat-label">Tarjeta</div>
              <div className="cr-stat-value">{formatCurrency(summary.cardIncome)}</div>
            </div>
          </div>

          <div className="cr-stat-card transfer">
            <div className="cr-stat-icon">🏦</div>
            <div className="cr-stat-info">
              <div className="cr-stat-label">Transferencia</div>
              <div className="cr-stat-value">{formatCurrency(summary.transferIncome)}</div>
            </div>
          </div>

          <div className="cr-stat-card orders">
            <div className="cr-stat-icon">📦</div>
            <div className="cr-stat-info">
              <div className="cr-stat-label">Órdenes</div>
              <div className="cr-stat-value">{summary.totalOrders}</div>
            </div>
          </div>

          <div className="cr-stat-card pending">
            <div className="cr-stat-icon">⚠️</div>
            <div className="cr-stat-info">
              <div className="cr-stat-label">Por Cobrar</div>
              <div className="cr-stat-value">{formatCurrency(summary.pendingPayments)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Count Section */}
      <div className="cr-section">
        <div className="cr-section-header">
          <h3>💵 Conteo de Efectivo</h3>
        </div>

        <div className="cr-cash-grid">
          <div className="cr-cash-input">
            <label>Efectivo en Caja (Real)</label>
            <input
              type="number"
              className="cr-input"
              value={cashCounted}
              onChange={(e) => setCashCounted(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>

          <div className="cr-cash-summary">
            <div className="cr-cash-row">
              <span>Efectivo Esperado:</span>
              <span className="cr-cash-amount">{formatCurrency(expectedCash)}</span>
            </div>
            <div className="cr-cash-row">
              <span>Efectivo Contado:</span>
              <span className="cr-cash-amount">{formatCurrency(countedCash)}</span>
            </div>
            <div className={`cr-cash-row difference ${cashDifference >= 0 ? 'positive' : 'negative'}`}>
              <span>Diferencia:</span>
              <span className="cr-cash-amount">
                {cashDifference >= 0 ? '+' : ''}{formatCurrency(cashDifference)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses Section */}
      <div className="cr-section">
        <div className="cr-section-header">
          <h3>📝 Gastos del Periodo</h3>
          <button
            className="cr-btn-add"
            onClick={() => setIsExpenseModalOpen(true)}
          >
            + Agregar Gasto
          </button>
        </div>

        <div className="cr-expenses-summary">
          <div className="cr-expense-total">
            Total Gastos: <span>{formatCurrency(totalExpenses)}</span>
          </div>
          <div className="cr-expense-final">
            Efectivo Final: <span className={finalCash >= 0 ? 'positive' : 'negative'}>
              {formatCurrency(finalCash)}
            </span>
          </div>
        </div>

        {expenses.length > 0 ? (
          <div className="cr-expenses-list">
            {expenses.map(expense => (
              <div key={expense.id} className="cr-expense-item">
                <div className="cr-expense-icon">{getCategoryIcon(expense.category)}</div>
                <div className="cr-expense-info">
                  <div className="cr-expense-concept">{expense.concept}</div>
                  <div className="cr-expense-details">
                    {getCategoryLabel(expense.category)} • {formatDate(expense.date)}
                  </div>
                  {expense.notes && (
                    <div className="cr-expense-notes">{expense.notes}</div>
                  )}
                </div>
                <div className="cr-expense-amount">{formatCurrency(expense.amount)}</div>
                <button
                  className="cr-expense-delete"
                  onClick={() => handleDeleteExpense(expense.id)}
                  title="Eliminar gasto"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="cr-empty-state">
            <div className="cr-empty-icon">📝</div>
            <div className="cr-empty-text">No hay gastos registrados en este periodo</div>
            <button
              className="cr-btn-add-empty"
              onClick={() => setIsExpenseModalOpen(true)}
            >
              + Agregar Primer Gasto
            </button>
          </div>
        )}
      </div>

      {/* Orders List Section */}
      <div className="cr-section">
        <div className="cr-section-header">
          <h3>📋 Detalle de Órdenes ({orders.length})</h3>
        </div>

        {orders.length > 0 ? (
          <div className="cr-orders-table-wrapper">
            <table className="cr-orders-table">
              <thead>
                <tr>
                  <th># Orden</th>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Anticipo</th>
                  <th>Saldo</th>
                  <th>Método</th>
                  <th>Estado Pago</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  const total = parseFloat(order.totalPrice) || 0;
                  const advance = parseFloat(order.advancePayment) || 0;
                  // Si está pagado, el saldo es 0 (sin importar si hubo anticipo o se pagó al final)
                  const remaining = order.paymentStatus === 'paid' ? 0 : (total - advance);

                  return (
                    <tr key={order.id}>
                      <td className="cr-order-number">{parseInt(order.orderNumber, 10)}</td>
                      <td className="cr-order-client">{order.client}</td>
                      <td className="cr-order-total">{formatCurrency(total)}</td>
                      <td className="cr-order-advance">{formatCurrency(advance)}</td>
                      <td className="cr-order-remaining">
                        {formatCurrency(remaining)}
                      </td>
                      <td className="cr-order-method">{getPaymentMethodLabel(order.paymentMethod)}</td>
                      <td>
                        <span className={`cr-payment-badge ${order.paymentStatus}`}>
                          {order.paymentStatus === 'paid' ? 'Pagado' :
                           order.paymentStatus === 'partial' ? 'Parcial' : 'Pendiente'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="cr-empty-state">
            <div className="cr-empty-icon">📦</div>
            <div className="cr-empty-text">No hay órdenes en este periodo</div>
          </div>
        )}
      </div>

      {/* Notes and Close Button */}
      <div className="cr-section">
        <div className="cr-section-header">
          <h3>📝 Notas y Cierre del Corte</h3>
        </div>

        {/* Employee Selector */}
        <div className="cr-employee-selector">
          <label className="cr-employee-label">
            <span className="cr-required">* </span>
            Empleado que realiza el corte:
          </label>
          <select
            className="cr-employee-select"
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            required
          >
            <option value="">Selecciona un empleado...</option>
            {employees.map(employee => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
        </div>

        <textarea
          className="cr-notes-textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Agrega notas u observaciones sobre este corte de caja..."
          rows={4}
          maxLength={500}
        />
        <div className="cr-char-counter">{notes.length}/500</div>

        <button
          className="cr-btn-close"
          onClick={handleCloseCashRegister}
          disabled={orders.length === 0 || !selectedEmployee}
        >
          🔒 Cerrar Corte de Caja
        </button>
      </div>

      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <Modal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
        >
          <ExpenseForm
            onSave={handleAddExpense}
            onCancel={() => setIsExpenseModalOpen(false)}
          />
        </Modal>
      )}

      {/* Confirm Dialog */}
      {confirmDialog.isOpen && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        />
      )}
    </div>
  );
};

CashRegister.propTypes = {
  orders: PropTypes.array.isRequired,
  dateFilter: PropTypes.string.isRequired
};

export default CashRegister;
