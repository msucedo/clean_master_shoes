import PropTypes from 'prop-types';
import './PageHeader.css';

const PageHeader = ({
  title,
  buttonLabel,
  buttonIcon,
  onButtonClick,
  showSearch = false,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  filters = []
}) => {
  return (
    <div className="page-header">
      {(title || buttonLabel) && (
        <div className="header-top">
          {title && <h1 className="page-title">{title}</h1>}
          {buttonLabel && (
            <button className="btn-primary-action" onClick={onButtonClick}>
              {buttonIcon && <span className="btn-icon">{buttonIcon}</span>}
              {buttonLabel}
            </button>
          )}
        </div>
      )}

      {(showSearch || filters.length > 0) && (
        <div className="controls">
          {showSearch && (
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              />
            </div>
          )}
          {filters.map((filter, idx) => (
            <button
              key={idx}
              className={`filter-btn ${filter.active ? 'active' : ''}`}
              onClick={filter.onClick}
            >
              {filter.icon && <span>{filter.icon}</span>} {filter.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

PageHeader.propTypes = {
  title: PropTypes.string,
  buttonLabel: PropTypes.string,
  buttonIcon: PropTypes.string,
  onButtonClick: PropTypes.func,
  showSearch: PropTypes.bool,
  searchValue: PropTypes.string,
  onSearchChange: PropTypes.func,
  searchPlaceholder: PropTypes.string,
  filters: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      icon: PropTypes.string,
      onClick: PropTypes.func.isRequired,
      active: PropTypes.bool
    })
  )
};

export default PageHeader;
