import { useEffect, useState } from 'react';
import './SplashScreen.css';

const SplashScreen = ({ onComplete }) => {
  const [stage, setStage] = useState('logo'); // logo -> text -> pulse -> fadeOut

  useEffect(() => {
    // Stage 1: Logo aparece (0-1s)
    const logoTimer = setTimeout(() => {
      setStage('text');
    }, 1000);

    // Stage 2: Texto aparece (1-2s)
    const textTimer = setTimeout(() => {
      setStage('pulse');
    }, 2000);

    // Stage 3: Pulso de luz (2-2.5s)
    const pulseTimer = setTimeout(() => {
      setStage('fadeOut');
    }, 2500);

    // Stage 4: Fade out y completar (2.5-3.5s)
    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, 3500);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(textTimer);
      clearTimeout(pulseTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className={`splash-screen stage-${stage}`}>
      {/* Fondo con gradiente animado */}
      <div className="splash-bg-gradient" />

      {/* Partículas flotantes */}
      <div className="splash-particles">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="splash-particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Contenido principal */}
      <div className="splash-content">
        {/* Logo con glow effect */}
        <div className="splash-logo">
          <div className="splash-logo-glow" />
          <img src="/logo.png" alt="Clean Master Shoes" className="splash-logo-emoji" />
        </div>

        {/* Pulso de luz */}
        {stage === 'pulse' && (
          <div className="splash-pulse" />
        )}

        {/* Texto revelándose */}
        {(stage === 'text' || stage === 'pulse' || stage === 'fadeOut') && (
          <div className="splash-text">
            <p className="splash-subtitle">SISTEMA DE GESTIÓN</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SplashScreen;
