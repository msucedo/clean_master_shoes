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

      {/* Partículas subiendo (80) */}
      <div className="splash-particles">
        {[...Array(80)].map((_, i) => (
          <div
            key={i}
            className="splash-particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`
            }}
          />
        ))}
      </div>

      {/* Partículas de fuego cayendo (30) */}
      <div className="splash-fire-particles">
        {[...Array(30)].map((_, i) => {
          const colors = ['#FF006E', '#FF4081', '#FF6B9D', '#FFB6C1', '#FFA500', '#FF6347'];
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          return (
            <div
              key={i}
              className="splash-fire-particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
                width: `${3 + Math.random() * 6}px`,
                height: `${3 + Math.random() * 6}px`,
                background: randomColor,
                boxShadow: `0 0 ${8 + Math.random() * 12}px ${randomColor}`
              }}
            />
          );
        })}
      </div>

      {/* Ondas de energía */}
      <div className="splash-energy-waves">
        <div className="splash-energy-wave" style={{ animationDelay: '0s' }} />
        <div className="splash-energy-wave" style={{ animationDelay: '0.5s' }} />
        <div className="splash-energy-wave" style={{ animationDelay: '1s' }} />
      </div>

      {/* Contenido principal */}
      <div className="splash-content">
        {/* Logo */}
        <div className="splash-logo">
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
