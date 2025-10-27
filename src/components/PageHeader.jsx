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
      <div className="header-main-row">
        {title && <h1 className="page-title">{title}</h1>}

        <div className="header-actions">
          {buttonLabel && (
            <button className="btn-add-compact" onClick={onButtonClick} title={buttonLabel}>
              {buttonIcon || '+'}
            </button>
          )}
        </div>
      </div>

      {showSearch && (
        <div className="search-row">
          <div className="search-box-full">
            <input
              type="text"
              className="search-input-full"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            />
          </div>
        </div>
      )}

      {filters.length > 0 && (
        <div className="filters-row">
          {/* Select para móvil (oculto en desktop por CSS) */}
          <select
            className="filters-select-mobile"
            onChange={(e) => {
              const selectedFilter = filters.find(f => f.label === e.target.value);
              if (selectedFilter) selectedFilter.onClick();
            }}
            value={filters.find(f => f.active)?.label || filters[0]?.label}
          >
            {filters.map((filter, idx) => (
              <option key={idx} value={filter.label}>
                {filter.icon && `${filter.icon} `}{filter.label}
              </option>
            ))}
          </select>

          {/* Botones para desktop/tablet (ocultos en móvil por CSS) */}
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
