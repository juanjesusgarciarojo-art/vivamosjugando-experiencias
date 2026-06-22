import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Droplet } from 'lucide-react';
import { actualizarFaseGrupo } from '../firebase';

export const Prueba2: React.FC = () => {
  const [code, setCode] = useState('');
  const [completed, setCompleted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const groupId = localStorage.getItem("gymkana_groupId");
    if (groupId) {
      actualizarFaseGrupo(groupId, "Prueba 2");
    }
  }, []);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (code) {
      setCompleted(true);
    }
  };

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <motion.div 
        initial={{ opacity: 0, rotate: -1, scale: 0.95 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        className="diary-page" 
        style={{ width: '100%', maxWidth: '420px', textAlign: 'center', border: '5px double var(--leather-brown)' }}
      >
        <div style={{ color: 'var(--forest-green)', marginBottom: '10px' }}>
          <MapPin size={48} strokeWidth={1.5} />
        </div>
        
        <h2 style={{ marginBottom: '15px', fontSize: '2rem' }}>El pumm track</h2>
        
        {!completed ? (
          <>
            {/* Contenedor del Avatar 2 con Animación */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
              <iframe
                width="315"
                height="560"
                src="https://www.youtube.com/embed/lLJURG9Amek?autoplay=1&rel=0"
                title="Guardián del Pump Track"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{ 
                  borderRadius: '12px', 
                  border: '4px solid var(--leather-brown)', 
                  boxShadow: '0 6px 15px rgba(0,0,0,0.2)', 
                  maxWidth: '100%',
                  aspectRatio: '9/16',
                  width: '100%',
                  height: 'auto',
                  maxHeight: '60vh'
                }}
              ></iframe>
            </div>

            <p style={{ marginBottom: '20px', color: 'var(--ink-light)', fontFamily: 'var(--font-hand)', fontSize: '1.4rem' }}>
              "¡Bienvenidos al circuito de velocidad! El Guardián ha perdido su cantimplora sagrada. Anotad aquí el código."
            </p>
            
            <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="text" placeholder="Anota el código aquí..." value={code} onChange={(e) => setCode(e.target.value)} required />
              
              <button type="submit" style={{ marginTop: '20px' }}>
                Verificar Clave
              </button>
            </form>
          </>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'relative' }}>
            <div className="stamp">COMPLETADO</div>
            <div style={{ color: 'var(--olive-green)', margin: '20px 0' }}>
              <Droplet size={64} style={{ margin: '0 auto' }} />
            </div>
            <p style={{ margin: '20px 0', fontWeight: 'bold', fontFamily: 'var(--font-hand)', fontSize: '1.5rem' }}>
              ¡Sensacional! Habéis obtenido el segundo fragmento del mapa.
            </p>
            
            <button onClick={() => navigate('/radar?dest=cubierta')} style={{ width: '100%' }}>
              Usar Brújula Mágica
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
