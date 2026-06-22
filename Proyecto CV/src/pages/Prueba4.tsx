import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ScrollText } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { actualizarFaseGrupo } from '../firebase';

export const Prueba4: React.FC = () => {
  const [scanned, setScanned] = useState(false);
  const [scanError, setScanError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const groupId = localStorage.getItem("gymkana_groupId");
    if (groupId) {
      actualizarFaseGrupo(groupId, "Prueba 4");
    }
  }, []);

  useEffect(() => {
    if (!scanned) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: {width: 250, height: 250} },
        false
      );
      
      scanner.render((decodedText) => {
        const normalized = decodedText.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
        if (normalized === "campamentoverano") {
          setScanned(true);
          setScanError('');
          scanner.clear();
        } else {
          setScanError("Este no es el código QR del mapa ancestral. ¡Sigue buscando!");
        }
      }, (_error) => {
        // quiet fail
      });

      return () => {
        scanner.clear().catch(e => console.error("Failed to clear scanner", e));
      };
    }
  }, [scanned]);

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <motion.div 
        initial={{ opacity: 0, rotate: -2, scale: 0.95 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        className="diary-page" 
        style={{ width: '100%', maxWidth: '400px', textAlign: 'center', border: '5px double var(--leather-brown)' }}
      >
        <div style={{ color: 'var(--forest-green)', marginBottom: '10px' }}>
          <ScrollText size={48} strokeWidth={1.5} />
        </div>
        
        <h2 style={{ marginBottom: '10px' }}>El tesoro perdido</h2>
        
        {!scanned ? (
          <>
            <p style={{ marginBottom: '20px', color: 'var(--ink-light)', fontFamily: 'var(--font-hand)', fontSize: '1.4rem' }}>
              "Debéis preguntar por el socorrista del sombrero de paja, el os tiene que dar el último trozo del mapa"
            </p>

            {scanError && (
              <div style={{
                background: 'rgba(139, 0, 0, 0.1)',
                border: '2px dashed var(--danger-red)',
                borderRadius: '8px',
                padding: '10px',
                marginBottom: '15px',
                color: 'var(--danger-red)',
                fontWeight: 'bold',
                fontSize: '1rem'
              }}>
                {scanError}
              </div>
            )}
            
            <div id="reader" style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', border: '4px solid var(--leather-brown)' }}></div>
            
            <button 
              onClick={() => { setScanned(true); setScanError(''); }}
              style={{ background: 'transparent', color: 'var(--ink-light)', border: 'none', boxShadow: 'none', marginTop: '20px', fontSize: '1rem' }}
            >
              [Dev] Simular hallazgo
            </button>
          </>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="stamp" style={{ fontSize: '2rem', padding: '10px 20px', transform: 'rotate(-5deg)', position: 'relative', zIndex: 2, marginBottom: '20px' }}>¡MAPA COMPLETADO!</div>
            
            <div style={{ 
              border: '4px solid var(--leather-brown)', 
              borderRadius: '8px', 
              overflow: 'hidden', 
              boxShadow: '0 6px 15px rgba(0,0,0,0.3)',
              marginBottom: '20px',
              maxWidth: '100%',
              background: '#f4ecd8'
            }}>
              <img 
                src="./mapa_completo.jpg" 
                alt="Mapa Sagrado Completo" 
                style={{ width: '100%', display: 'block' }} 
              />
            </div>
            
            <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.3rem', color: 'var(--ink-light)', marginBottom: '20px' }}>
              ¡Increíble! Habéis reunido todos los fragmentos del mapa y revelado la ubicación final del tesoro. ¡Es hora de reclamar vuestra recompensa y guardar el recuerdo!
            </p>
            
            <button onClick={() => navigate('/victoria')} style={{ width: '100%' }}>
              Reclamar la Gloria
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
