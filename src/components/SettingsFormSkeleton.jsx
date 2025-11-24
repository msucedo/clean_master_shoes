import './SettingsFormSkeleton.css';

const SettingsFormSkeleton = ({ rows = 3 }) => {
  return (
    <div className="settings-form-skeleton">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="skeleton-form-group">
          <div className="skeleton skeleton-label"></div>
          <div className="skeleton skeleton-input"></div>
        </div>
      ))}

      <div className="skeleton-btn-group">
        <div className="skeleton skeleton-btn skeleton-btn-primary"></div>
        <div className="skeleton skeleton-btn skeleton-btn-secondary"></div>
      </div>
    </div>
  );
};

export default SettingsFormSkeleton;
