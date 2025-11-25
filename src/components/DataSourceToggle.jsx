import PropTypes from 'prop-types';
import './DataSourceToggle.css';

const DataSourceToggle = ({ value, onChange }) => {
  return (
    <div className="data-source-toggle">
      <button
        className={`dst-option ${value === 'cortes' ? 'active' : ''}`}
        onClick={() => onChange('cortes')}
      >
        <span className="dst-icon">📋</span>
        <span className="dst-label">Cortes de Caja</span>
      </button>
      <button
        className={`dst-option ${value === 'ordenes' ? 'active' : ''}`}
        onClick={() => onChange('ordenes')}
      >
        <span className="dst-icon">📦</span>
        <span className="dst-label">Órdenes Directas</span>
      </button>
      <div className={`dst-slider ${value === 'ordenes' ? 'right' : ''}`}></div>
    </div>
  );
};

DataSourceToggle.propTypes = {
  value: PropTypes.oneOf(['cortes', 'ordenes']).isRequired,
  onChange: PropTypes.func.isRequired
};

export default DataSourceToggle;
