import { useNavigate } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <div className="not-found-icon">🔍</div>
        <h1 className="not-found-title">Página no encontrada</h1>
        <p className="not-found-message">
          La página que buscas no existe o fue movida.
        </p>
        <button
          className="btn-back-home"
          onClick={() => navigate('/')}
        >
          ← Volver al Dashboard
        </button>
      </div>
    </div>
  );
};

export default NotFound;
