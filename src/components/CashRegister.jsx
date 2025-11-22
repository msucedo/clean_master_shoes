import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';
import ExpenseForm from './ExpenseForm';
import ConfirmDialog from './ConfirmDialog';
import {
  saveCashRegisterClosure,
  subscribeToEmployees
} from '../services/firebaseService';
import { useNotification } from '../contexts/NotificationContext';
import './CashRegister.css';

// eslint-disable-next-line no-unused-vars
const CashRegister = ({ orders, dateFilter }) => {
  const { showSuccess, showError } = useNotification();

  const [expenses, setExpenses] = useState([]);
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
  const [habilitarCorteSinValidacion, setHabilitarCorteSinValidacion] = useState(false);

  // Nuevo: Estados para conteo de ingresos
  const [dineroInicial, setDineroInicial] = useState('');

  // Efectivo - Billetes y monedas
  const [billetes, setBilletes] = useState({
    1000: 0,
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0
  });

  const [monedas, setMonedas] = useState({
    10: 0,
    5: 0,
    2: 0,
    1: 0,
    0.5: 0
  });

  // Tarjeta - Lista de cobros
  const [cobrosTarjeta, setCobrosTarjeta] = useState([{ monto: '' }]);

  // Transferencia - Lista de transferencias
  const [transferencias, setTransferencias] = useState([{ monto: '' }]);

  // Load employees
  useEffect(() => {
    const unsubscribe = subscribeToEmployees((employeesData) => {
      // Filter only active employees
      const activeEmployees = employeesData.filter(emp => emp.status === 'active');
      setEmployees(activeEmployees);
    });

    return () => unsubscribe();
  }, []);

  const getDateRange = () => {
    // Helper para convertir Date a formato YYYY-MM-DD local (sin UTC)
    const formatLocalDate = (date) => {
      return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    };

    // Siempre retornar el rango del día actual (Corte de Caja es diario)
    const now = new Date();
    const startDate = formatLocalDate(new Date(now.setHours(0, 0, 0, 0)));
    const endDate = formatLocalDate(new Date(now.setHours(23, 59, 59, 999)));

    return { startDate, endDate };
  };

  // Calculate financial summary
  const calculateSummary = () => {
    let totalIncome = 0;
    let cashIncome = 0;
    let cardIncome = 0;
    let transferIncome = 0;
    let totalOrders = 0;
    let totalProductos = 0;

    orders.forEach(order => {
      const total = parseFloat(order.totalPrice) || 0;
      const advance = parseFloat(order.advancePayment) || 0;

      // Determine amount to count based on payment status
      let amountToCount = 0;
      if (order.paymentStatus === 'paid') {
        // If fully paid, count the total amount
        amountToCount = total;
      } else if (order.paymentStatus === 'partial') {
        // If partial, count only the advance
        amountToCount = advance;
      }
      // If pending, amountToCount stays 0

      totalIncome += amountToCount;
      totalOrders++;

      // Count products sold
      totalProductos += order.products?.reduce((sum, p) => sum + (p.quantity || 0), 0) || 0;

      // Count by payment method
      if (order.paymentMethod === 'cash' && amountToCount > 0) {
        cashIncome += amountToCount;
      } else if (order.paymentMethod === 'card' && amountToCount > 0) {
        cardIncome += amountToCount;
      } else if (order.paymentMethod === 'transfer' && amountToCount > 0) {
        transferIncome += amountToCount;
      }
    });

    return {
      totalIncome,
      cashIncome,
      cardIncome,
      transferIncome,
      totalOrders,
      totalProductos
    };
  };

  const summary = calculateSummary();

  // Calculate expenses total
  const totalExpenses = expenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);

  // ==== NUEVOS CÁLCULOS: Conteo de Ingresos ====

  // Calcular total de efectivo contado
  const calcularEfectivoContado = () => {
    let totalBilletes = 0;
    Object.keys(billetes).forEach(denominacion => {
      totalBilletes += parseFloat(denominacion) * parseInt(billetes[denominacion] || 0);
    });

    let totalMonedas = 0;
    Object.keys(monedas).forEach(denominacion => {
      totalMonedas += parseFloat(denominacion) * parseInt(monedas[denominacion] || 0);
    });

    return totalBilletes + totalMonedas;
  };

  // Calcular total de cobros con tarjeta
  const calcularTotalTarjeta = () => {
    return cobrosTarjeta.reduce((sum, cobro) => {
      return sum + (parseFloat(cobro.monto) || 0);
    }, 0);
  };

  // Calcular total de transferencias
  const calcularTotalTransferencias = () => {
    return transferencias.reduce((sum, trans) => {
      return sum + (parseFloat(trans.monto) || 0);
    }, 0);
  };

  // Totales del conteo
  const efectivoContado = calcularEfectivoContado();
  const tarjetaContada = calcularTotalTarjeta();
  const transferenciaContada = calcularTotalTransferencias();
  const totalConteoIngresos = efectivoContado + tarjetaContada + transferenciaContada;
  const dineroInicialNum = parseFloat(dineroInicial) || 0;

  // Totales del sistema (ventas registradas + dinero inicial)
  const efectivoSistema = summary.cashIncome + dineroInicialNum;
  const tarjetaSistema = summary.cardIncome;
  const transferenciaSistema = summary.transferIncome;
  const totalSistema = efectivoSistema + tarjetaSistema + transferenciaSistema;

  // Diferencias (contado vs sistema)
  const diferenciaEfectivo = efectivoContado - efectivoSistema;
  const diferenciaTarjeta = tarjetaContada - tarjetaSistema;
  const diferenciaTransferencia = transferenciaContada - transferenciaSistema;
  const diferenciasTotal = diferenciaEfectivo + diferenciaTarjeta + diferenciaTransferencia;

  // Resultados finales

  const ingresosTotal = totalConteoIngresos;
  const gananciaDia = totalConteoIngresos - dineroInicialNum - totalExpenses;

  // Handlers para billetes y monedas
  const handleBilleteChange = (denominacion, valor) => {
    setBilletes(prev => ({
      ...prev,
      [denominacion]: parseInt(valor) || 0
    }));
  };

  const incrementarBillete = (denominacion) => {
    setBilletes(prev => ({
      ...prev,
      [denominacion]: (prev[denominacion] || 0) + 1
    }));
  };

  const decrementarBillete = (denominacion) => {
    setBilletes(prev => ({
      ...prev,
      [denominacion]: Math.max(0, (prev[denominacion] || 0) - 1)
    }));
  };

  const handleMonedaChange = (denominacion, valor) => {
    setMonedas(prev => ({
      ...prev,
      [denominacion]: parseInt(valor) || 0
    }));
  };

  const incrementarMoneda = (denominacion) => {
    setMonedas(prev => ({
      ...prev,
      [denominacion]: (prev[denominacion] || 0) + 1
    }));
  };

  const decrementarMoneda = (denominacion) => {
    setMonedas(prev => ({
      ...prev,
      [denominacion]: Math.max(0, (prev[denominacion] || 0) - 1)
    }));
  };

  // Handlers para tarjeta
  const handleCobroTarjetaChange = (index, valor) => {
    const nuevosCobros = [...cobrosTarjeta];
    nuevosCobros[index].monto = valor;
    setCobrosTarjeta(nuevosCobros);
  };

  const agregarCobroTarjeta = () => {
    setCobrosTarjeta([...cobrosTarjeta, { monto: '' }]);
  };

  const eliminarCobroTarjeta = (index) => {
    if (cobrosTarjeta.length > 1) {
      const nuevosCobros = cobrosTarjeta.filter((_, i) => i !== index);
      setCobrosTarjeta(nuevosCobros);
    }
  };

  // Handlers para transferencia
  const handleTransferenciaChange = (index, valor) => {
    const nuevasTransferencias = [...transferencias];
    nuevasTransferencias[index].monto = valor;
    setTransferencias(nuevasTransferencias);
  };

  const agregarTransferencia = () => {
    setTransferencias([...transferencias, { monto: '' }]);
  };

  const eliminarTransferencia = (index) => {
    if (transferencias.length > 1) {
      const nuevasTransferencias = transferencias.filter((_, i) => i !== index);
      setTransferencias(nuevasTransferencias);
    }
  };

  const handleAddExpense = (expenseData) => {
    try {
      // Generar ID único para el gasto local
      const newExpense = {
        ...expenseData,
        id: `temp_${Date.now()}_${Math.random()}`,
        createdAt: new Date().toISOString()
      };
      setExpenses([...expenses, newExpense]);
      showSuccess('Gasto agregado exitosamente');
      setIsExpenseModalOpen(false);
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
      onConfirm: () => {
        try {
          setExpenses(expenses.filter(e => e.id !== expenseId));
          showSuccess('Gasto eliminado');
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
      message: '¿Deseas cerrar el corte de caja del día? Esta acción guardará el corte como solo lectura.',
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
              tipo: 'hoy'
            },
            // Dinero inicial
            dineroInicial: dineroInicialNum,
            // Conteo de ingresos (lo que el usuario contó físicamente)
            conteoIngresos: {
              efectivo: {
                billetes: { ...billetes },
                monedas: { ...monedas },
                total: efectivoContado
              },
              tarjeta: {
                cobros: cobrosTarjeta.map(c => parseFloat(c.monto) || 0),
                total: tarjetaContada
              },
              transferencia: {
                transferencias: transferencias.map(t => parseFloat(t.monto) || 0),
                total: transferenciaContada
              },
              totalGeneral: totalConteoIngresos
            },
            // Dinero en sistema (lo que el sistema tiene registrado)
            dineroEnSistema: {
              efectivo: efectivoSistema,
              tarjeta: tarjetaSistema,
              transferencia: transferenciaSistema,
              total: totalSistema
            },
            // Diferencias (contado vs sistema)
            diferencias: {
              efectivo: diferenciaEfectivo,
              tarjeta: diferenciaTarjeta,
              transferencia: diferenciaTransferencia,
              total: diferenciasTotal
            },
            // Gastos
            gastos: {
              items: expenses.map(e => ({ ...e })),
              total: totalExpenses
            },
            // Resultados finales
            resultados: {
              ingresosTotal: ingresosTotal,
              gastosTotal: totalExpenses,
              gananciaDia: gananciaDia
            },
            // Info adicional
            ordenes: orders.map(o => o.id),
            totalOrdenes: summary.totalOrders,
            totalProductos: summary.totalProductos,
            notas: notes
          };

          await saveCashRegisterClosure(closureData);
          showSuccess('Corte de caja cerrado exitosamente');

          // Reset form
          setDineroInicial('');
          setBilletes({ 1000: 0, 500: 0, 200: 0, 100: 0, 50: 0, 20: 0 });
          setMonedas({ 10: 0, 5: 0, 2: 0, 1: 0, 0.5: 0 });
          setCobrosTarjeta([{ monto: '' }]);
          setTransferencias([{ monto: '' }]);
          setNotes('');
          setSelectedEmployee('');
          setExpenses([]); // Limpiar gastos
          setHabilitarCorteSinValidacion(false); // Resetear checkbox

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
    // Parsear como fecha local (YYYY-MM-DD) para evitar problemas de timezone
    const [year, month, day] = dateString.split('-');
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="cash-register">
      {/* Financial Summary Section */}
      <div className="cr-section">
        <div className="cr-section-header">
          <h3>💰 Resumen Financiero</h3>
          <div className="cr-period-badge">Hoy</div>
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
              <div className="cr-stat-label">Ingresos de Efectivo</div>
              <div className="cr-stat-value">{formatCurrency(summary.cashIncome)}</div>
            </div>
          </div>

          <div className="cr-stat-card card">
            <div className="cr-stat-icon">💳</div>
            <div className="cr-stat-info">
              <div className="cr-stat-label">Ingresos de Tarjeta</div>
              <div className="cr-stat-value">{formatCurrency(summary.cardIncome)}</div>
            </div>
          </div>

          <div className="cr-stat-card transfer">
            <div className="cr-stat-icon">🏦</div>
            <div className="cr-stat-info">
              <div className="cr-stat-label"> Ingresos de Transferencia</div>
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

          <div className="cr-stat-card products">
            <div className="cr-stat-icon">🛍️</div>
            <div className="cr-stat-info">
              <div className="cr-stat-label">Productos</div>
              <div className="cr-stat-value">{summary.totalProductos || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* NUEVA SECCIÓN 1: Conteo de Ingresos */}
      <div className="cr-section">
        <div className="cr-section-header">
          <h3>📊 Conteo de Ingresos</h3>
        </div>

        {/* Dinero Inicial */}
        <div className="cr-subsection">
          <h4 className="cr-subsection-title">💰 Dinero Inicial en Caja</h4>
          <div className="cr-inicial-input">
            <input
              type="number"
              className="cr-input"
              value={dineroInicial}
              onChange={(e) => setDineroInicial(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>
        </div>

        {/* Efectivo - Billetes y Monedas */}
        <div className="cr-subsection">
          <h4 className="cr-subsection-title">💵 Efectivo</h4>
          <div className='cr-subsection-conteoBilletesMonedas'>
          {/* Billetes */}
          <div className="cr-denomination-group">
            <h5 className="cr-group-label">Billetes</h5>
            <div className="cr-bill-grid">
              {[1000, 500, 200, 100, 50, 20].map(denominacion => (
                <div key={denominacion} className="cr-bill-row">
                  <span className="cr-bill-label">${denominacion}</span>
                  <button
                    className="cr-bill-btn-decrement"
                    onClick={() => decrementarBillete(denominacion)}
                    type="button"
                  >
                    ⬇️
                  </button>
                  <input
                    type="number"
                    className="cr-bill-input"
                    value={billetes[denominacion]!=0?billetes[denominacion]:""}
                    readOnly
                    placeholder="0"
                  />
                  <button
                    className="cr-bill-btn-increment"
                    onClick={() => incrementarBillete(denominacion)}
                    type="button"
                  >
                    ⬆️
                  </button>
                  <span className="cr-bill-equal">=</span>
                  <span className="cr-bill-total">
                    {formatCurrency(denominacion * billetes[denominacion])}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Monedas */}
          <div className="cr-denomination-group">
            <h5 className="cr-group-label">Monedas</h5>
            <div className="cr-bill-grid">
              {[10, 5, 2, 1, 0.5].map(denominacion => (
                <div key={denominacion} className="cr-bill-row">
                  <span className="cr-bill-label">${denominacion}</span>
                  <button
                    className="cr-bill-btn-decrement"
                    onClick={() => decrementarMoneda(denominacion)}
                    type="button"
                  >
                    ⬇️
                  </button>
                  <input
                    type="number"
                    className="cr-bill-input"
                    value={monedas[denominacion]!=0?monedas[denominacion]:""}
                    readOnly
                    placeholder="0"
                  />
                  <button
                    className="cr-bill-btn-increment"
                    onClick={() => incrementarMoneda(denominacion)}
                    type="button"
                  >
                    ⬆️
                  </button>
                  <span className="cr-bill-equal">=</span>
                  <span className="cr-bill-total">
                    {formatCurrency(denominacion * monedas[denominacion])}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {/* Total Efectivo */}
          <div className="cr-subtotal-row">
            <span>Total Efectivo Contado:</span>
            <span className="cr-subtotal-amount">{formatCurrency(efectivoContado)}</span>
          </div>
          </div>
        </div>
        <div className='cr-subsection nocash'>
        {/* Tarjeta */}
        <div className="cr-subsection">
          <h4 className="cr-subsection-title">💳 Tarjeta (Terminal/TPV)</h4>
          <div className="cr-payments-list">
            {cobrosTarjeta.map((cobro, index) => (
              <div key={index} className="cr-payment-row">
                <span className="cr-payment-label">Cobro #{index + 1}:</span>
                <input
                  type="number"
                  className="cr-payment-input"
                  value={cobro.monto}
                  onChange={(e) => handleCobroTarjetaChange(index, e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
                {cobrosTarjeta.length > 1 && (
                  <button
                    className="cr-payment-delete"
                    onClick={() => eliminarCobroTarjeta(index)}
                    title="Eliminar cobro"
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}
            <button className="cr-add-payment-btn" onClick={agregarCobroTarjeta}>
              + Agregar otro cobro
            </button>
          </div>
          <div className="cr-subtotal-row">
            <span>Total Tarjeta:</span>
            <span className="cr-subtotal-amount">{formatCurrency(tarjetaContada)}</span>
          </div>
        </div>

        {/* Transferencia */}
        <div className="cr-subsection">
          <h4 className="cr-subsection-title">🏦 Transferencia (Banco/App)</h4>
          <div className="cr-payments-list">
            {transferencias.map((trans, index) => (
              <div key={index} className="cr-payment-row">
                <span className="cr-payment-label">Transferencia #{index + 1}:</span>
                <input
                  type="number"
                  className="cr-payment-input"
                  value={trans.monto}
                  onChange={(e) => handleTransferenciaChange(index, e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
                {transferencias.length > 1 && (
                  <button
                    className="cr-payment-delete"
                    onClick={() => eliminarTransferencia(index)}
                    title="Eliminar transferencia"
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}
            <button className="cr-add-payment-btn" onClick={agregarTransferencia}>
              + Agregar otra transferencia
            </button>
          </div>
          <div className="cr-subtotal-row">
            <span>Total Transferencia:</span>
            <span className="cr-subtotal-amount">{formatCurrency(transferenciaContada)}</span>
          </div>
        </div>
        </div>
        {/* Total General del Conteo */}
        <div className="cr-total-row">
          <span>💰 TOTAL CONTEO DE INGRESOS:</span>
          <span className="cr-total-amount">{formatCurrency(totalConteoIngresos)}</span>
        </div>
      </div>

      {/* NUEVA SECCIÓN 2: Dinero en Caja (Sistema) */}
      <div className="cr-section">
        <div className="cr-section-header">
          <h3>💻 Dinero en Caja (Sistema)</h3>
        </div>

        <div className="cr-comparison-grid">
          <div className="cr-comparison-row">
            <span className="cr-comp-label">💵 Efectivo en Sistema(caja inicial + órdenes):</span>
            <span className="cr-comp-amount">{formatCurrency(efectivoSistema)}</span>
            <span className={`cr-comp-diff ${diferenciaEfectivo >= 0 ? 'positive' : 'negative'}`}>
              {diferenciaEfectivo >= 0 ? '+' : ''}{formatCurrency(diferenciaEfectivo)}
            </span>
          </div>
          <div className="cr-comparison-row">
            <span className="cr-comp-label">💳 Tarjeta en Sistema:</span>
            <span className="cr-comp-amount">{formatCurrency(tarjetaSistema)}</span>
            <span className={`cr-comp-diff ${diferenciaTarjeta >= 0 ? 'positive' : 'negative'}`}>
              {diferenciaTarjeta >= 0 ? '+' : ''}{formatCurrency(diferenciaTarjeta)}
            </span>
          </div>
          <div className="cr-comparison-row">
            <span className="cr-comp-label">🏦 Transferencia en Sistema:</span>
            <span className="cr-comp-amount">{formatCurrency(transferenciaSistema)}</span>
            <span className={`cr-comp-diff ${diferenciaTransferencia >= 0 ? 'positive' : 'negative'}`}>
              {diferenciaTransferencia >= 0 ? '+' : ''}{formatCurrency(diferenciaTransferencia)}
            </span>
          </div>
          <div className="cr-comparison-row total">
            <span className="cr-comp-label">💰 Total en Sistema:</span>
            <span className="cr-comp-amount">{formatCurrency(totalSistema)}</span>
            <span className={`cr-comp-diff ${diferenciasTotal >= 0 ? 'positive' : 'negative'}`}>
              {diferenciasTotal >= 0 ? '+' : ''}{formatCurrency(diferenciasTotal)}
            </span>
          </div>
        </div>

        {diferenciasTotal !== 0 && (
          <div className={`cr-alert ${diferenciasTotal >= 0 ? 'info' : 'warning'}`}>
            {diferenciasTotal > 0 ? '✅' : '⚠️'} Diferencia total: {diferenciasTotal > 0 ? 'Sobrante' : 'Faltante'} de {formatCurrency(Math.abs(diferenciasTotal))}
          </div>
        )}
      </div>

      {/* NUEVA SECCIÓN 3: Resultados */}
      <div className="cr-section">
        <div className="cr-section-header">
          <h3>📈 Resultados</h3>
        </div>

        <div className="cr-results-grid">
          <div className="cr-result-card">
            <div className="cr-result-icon">💰</div>
            <div className="cr-result-info">
              <div className="cr-result-label">Total</div>
              <div className="cr-result-sublabel">Efectivo + Tarjeta + Transferencia</div>
              <div className="cr-result-value">{formatCurrency(ingresosTotal)}</div>
            </div>
          </div>

          <div className="cr-result-card">
            <div className="cr-result-icon">📝</div>
            <div className="cr-result-info">
              <div className="cr-result-label">Gastos Totales</div>
              <div className="cr-result-sublabel">{expenses.length} gastos</div>
              <div className="cr-result-value expense">{formatCurrency(totalExpenses)}</div>
            </div>
          </div>

          <div className="cr-result-card highlight">
            <div className="cr-result-icon">🎯</div>
            <div className="cr-result-info">
              <div className="cr-result-label">Ganancia del Día</div>
              <div className="cr-result-sublabel">Ingresos - Dinero Inicial - Gastos</div>
              <div className={`cr-result-value ${gananciaDia >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(gananciaDia)}
              </div>
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

        {/* Checkbox para habilitar corte sin validaciones */}
        <div className="cr-flexible-closure-checkbox">
          <label className="cr-checkbox-label">
            <input
              type="checkbox"
              checked={habilitarCorteSinValidacion}
              onChange={(e) => setHabilitarCorteSinValidacion(e.target.checked)}
            />
            <span className="cr-checkbox-text">
              Habilitar corte sin órdenes y con diferencias de dinero en el sistema
            </span>
          </label>
        </div>

        <button
          className="cr-btn-close"
          onClick={handleCloseCashRegister}
          disabled={!selectedEmployee || (!habilitarCorteSinValidacion && (orders.length === 0 || diferenciasTotal !== 0))}
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
