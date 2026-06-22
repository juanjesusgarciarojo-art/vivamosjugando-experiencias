import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Hourglass as HourglassIcon } from 'lucide-react';

export const Hourglass: React.FC = () => {
  const [rotation, setRotation] = useState(0);

  // Animación para que el reloj de arena gire cada cierto tiempo
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => prev + 180);
    }, 10000); // Gira cada 10 segundos para dar efecto
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: '15px',
      right: '15px',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: 'rgba(92, 58, 33, 0.8)',
      padding: '5px 12px',
      borderRadius: '20px',
      border: '2px solid var(--gold-aged)',
      boxShadow: '0 0 15px var(--magic-glow)'
    }}>
      <motion.div
        animate={{ rotate: rotation }}
        transition={{ duration: 1, ease: "easeInOut" }}
        style={{ color: 'var(--magic-turquoise)' }}
      >
        <HourglassIcon size={24} fill="var(--magic-turquoise)" fillOpacity={0.4} />
      </motion.div>
      <span style={{ 
        fontFamily: 'var(--font-title)', 
        color: 'var(--magic-turquoise)',
        letterSpacing: '1px',
        textShadow: '0 0 5px var(--magic-glow)'
      }}>
        ENERGÍA
      </span>
    </div>
  );
};
