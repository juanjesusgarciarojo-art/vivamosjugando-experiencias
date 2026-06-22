import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ShieldAlert } from 'lucide-react';
import { actualizarFaseGrupo } from '../firebase';

export const Prueba3: React.FC = () => {
  const [coords, setCoords] = useState('');
  const [completed, setCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const groupId = localStorage.getItem("gymkana_groupId");
    if (groupId) {
      actualizarFaseGrupo(groupId, "Prueba 3");
    }
  }, []);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Extraer cualquier número con punto o coma decimal
    const matches = coords.match(/-?\d+(?:[.,]\d+)?/g);
    if (matches && matches.length === 2) {
      const lat = parseFloat(matches[0].replace(',', '.'));
      const lng = parseFloat(matches[1].replace(',', '.'));
      
      const targetLat = 40.668306;
      const targetLngVal = 3.208242; // valor absoluto para ser flexible con el menos

      // Permitir tolerancia por diferencias de precisión
      const latCorrect = Math.abs(lat - targetLat) < 0.0001;
      const lngCorrect = Math.abs(Math.abs(lng) - targetLngVal) < 0.0001;

      if (latCorrect && lngCorrect) {
        setCompleted(true);
      } else {
        setErrorMessage('¡Las coordenadas no coinciden con las escritas en el pergamino ancestral! Revisa tu diario e inténtalo de nuevo, explorador.');
      }
    } else {
      setErrorMessage('Formato de coordenadas no válido. Introduce latitud y longitud (Ej: 40.668306, -3.208242)');
    }
  };

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <motion.div 
        initial={{ opacity: 0, rotate: 1, scale: 0.95 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        className="diary-page" 
        style={{ width: '100%', maxWidth: '420px', textAlign: 'center', border: '5px double var(--leather-brown)' }}
      >
        <div style={{ color: 'var(--forest-green)', marginBottom: '10px' }}>
          <Search size={48} strokeWidth={1.5} />
        </div>
        
        <h2 style={{ marginBottom: '15px', fontSize: '2rem' }}>El Cofre Antiguo</h2>
        
        {!completed ? (
          <>
            <p style={{ marginBottom: '20px', color: 'var(--ink-light)', fontFamily: 'var(--font-hand)', fontSize: '1.4rem' }}>
              "Deberéis auxiliar a la persona que os pida ayuda pues os dirá como seguir"
            </p>

            {errorMessage && (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ 
                  background: 'rgba(139, 0, 0, 0.1)', 
                  border: '2px dashed var(--danger-red)', 
                  borderRadius: '8px', 
                  padding: '12px', 
                  marginBottom: '20px',
                  color: 'var(--danger-red)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  textAlign: 'left'
                }}
              >
                <ShieldAlert size={24} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </motion.div>
            )}
            
            <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input 
                type="text" 
                placeholder="Coordenadas (Ej: 40.668306, -3.208242)" 
                value={coords} 
                onChange={(e) => setCoords(e.target.value)} 
                required 
              />
              
              <button type="submit" style={{ marginTop: '20px' }}>
                Descifrar Coordenadas
              </button>
            </form>
          </>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'relative' }}>
            <div className="stamp">COMPLETADO</div>

            {/* Contenedor del Avatar 3 Animado */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '20px 0' }}>
              <iframe
                width="315"
                height="560"
                src="https://www.youtube.com/embed/ZTnUvCnq5oQ?autoplay=1&rel=0"
                title="Guardián del Cofre"
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

            <p style={{ margin: '20px 0', fontWeight: 'bold', fontFamily: 'var(--font-hand)', fontSize: '1.5rem' }}>
              ¡Coordenadas correctas! El mapa está casi completo. ¡A por la prueba final en la Piscina!
            </p>
            
            <button onClick={() => navigate('/radar?dest=piscina')} style={{ width: '100%', marginTop: '10px' }}>
              Usar Brújula Mágica
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
