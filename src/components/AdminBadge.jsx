import './AdminBadge.css';

const AdminBadge = ({ inline = false, small = false }) => {
  return (
    <span className={`admin-badge ${inline ? 'inline' : ''} ${small ? 'small' : ''}`}>
      <span className="admin-badge-icon">👑</span>
      <span className="admin-badge-text">Admin</span>
    </span>
  );
};

export default AdminBadge;
