import { useEffect, useState } from 'react';
import './LoadingScreen.css';

const LoadingScreen = ({ onLoadingComplete }) => {
  const [progress, setProgress] = useState(0);
  const [animationStage, setAnimationStage] = useState('fadeIn');

  useEffect(() => {
    // Simular progreso de carga con incrementos no-lineales
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Incremento aleatorio para sentirse más natural (ajustado para ~5 segundos)
        const increment = Math.random() * 10 + 8;
        return Math.min(prev + increment, 100);
      });
    }, 350); // Intervalo ajustado a 350ms para duración total ~5s

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      // Pequeña pausa al llegar a 100%
      setTimeout(() => {
        setAnimationStage('zoomIn');
        // Notificar que terminó después de la animación zoom
        setTimeout(() => {
          onLoadingComplete?.();
        }, 600); // Duración de la animación zoom-in
      }, 200);
    }
  }, [progress, onLoadingComplete]);

  return (
    <div className={`loading-screen ${animationStage}`}>
      <div className="loading-content">
        {/* Logo y título */}
        <div className="loading-logo">
          <h1 className="loading-title">Clean Master Shoes</h1>
          <p className="loading-subtitle">Iniciando sesión</p>
        </div>

        {/* Barra de progreso */}
        <div className="loading-progress-container">
          <div className="loading-progress-bar">
            <div
              className="loading-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="loading-percentage">{Math.round(progress)}%</div>
        </div>
      </div>

      {/* Gradiente animado de fondo */}
      <div className="loading-bg-gradient" />
    </div>
  );
};

export default LoadingScreen;
