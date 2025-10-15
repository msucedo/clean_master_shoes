import { useState } from 'react';
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
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const handleSearchToggle = () => {
    if (!isSearchExpanded) {
      setIsSearchExpanded(true);
    }
  };

  const handleSearchBlur = () => {
    if (!searchValue) {
      setIsSearchExpanded(false);
    }
  };

  return (
    <div className="page-header">
      <div className="header-main-row">
        {title && <h1 className="page-title">{title}</h1>}

        <div className="header-actions">
          {showSearch && (
            <div className={`search-box-compact ${isSearchExpanded ? 'expanded' : ''}`}>
              <span className="search-icon" onClick={handleSearchToggle}>🔍</span>
              <input
                type="text"
                className="search-input-compact"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                onFocus={() => setIsSearchExpanded(true)}
                onBlur={handleSearchBlur}
              />
            </div>
          )}
          {buttonLabel && (
            <button className="btn-add-compact" onClick={onButtonClick} title={buttonLabel}>
              {buttonIcon || '+'}
            </button>
          )}
        </div>
      </div>

      {filters.length > 0 && (
        <div className="filters-row">
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
