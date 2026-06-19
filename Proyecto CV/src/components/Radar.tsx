import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';

const DESTINATIONS = {
  pumptrack: { lat: 40.664538, lng: -3.205502, nextUrl: '/prueba2', name: 'Pump Track' },
  cubierta: { lat: 40.669040, lng: -3.210363, nextUrl: '/prueba3', name: 'La Cubierta' },
  piscina: { lat: 40.668306, lng: -3.208242, nextUrl: '/prueba4', name: 'La Piscina' }
};

export const Radar: React.FC = () => {
  const [searchParams] = useSearchParams();
  const destKey = searchParams.get('dest') as keyof typeof DESTINATIONS;
  const destination = DESTINATIONS[destKey];
  const isModoPrueba = localStorage.getItem("gymkana_modo_prueba") === "true";
  
  const [distance, setDistance] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  };

  useEffect(() => {
    if (!destination) { setError("Destino desconocido"); return; }
    if (!navigator.geolocation) { setError("Tu dispositivo no soporta GPS"); return; }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, heading: deviceHeading } = position.coords;
        setDistance(Math.round(calculateDistance(latitude, longitude, destination.lat, destination.lng)));
        
        if (deviceHeading !== null) {
          const dLon = (destination.lng - longitude) * Math.PI / 180;
          const lat1 = latitude * Math.PI / 180;
          const lat2 = destination.lat * Math.PI / 180;
          const y = Math.sin(dLon) * Math.cos(lat2);
          const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
          let brng = Math.atan2(y, x) * 180 / Math.PI;
          setHeading((brng + 360) % 360 - deviceHeading);
        }
      },
      () => { setError("Activa el GPS de tu artefacto explorador."); },
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [destination]);

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', marginTop: '50px' }}>
        <h2 style={{color: 'var(--danger-red)'}}>¡Cuidado!</h2>
        <p style={{fontSize: '1.5rem'}}>{error}</p>
        {isModoPrueba && (
          <button onClick={() => navigate(destination?.nextUrl || '/')} style={{ marginTop: '20px' }}>
            [Dev] Saltar a Destino
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'rgba(44, 30, 22, 0.45)', backdropFilter: 'blur(3px)', color: 'white' }}>
      <h1 style={{ color: 'var(--gold-aged)', marginBottom: '10px', textAlign: 'center', textShadow: '2px 2px 4px rgba(0,0,0,0.6)' }}>La Brújula Mágica</h1>
      <p style={{ marginBottom: '45px', color: 'var(--paper-bg)', textAlign: 'center', fontFamily: 'var(--font-hand)', fontSize: '1.4rem' }}>El artefacto ancestral resplandece marcando el camino...</p>
      
      <div style={{ 
        position: 'relative', width: '280px', height: '280px', borderRadius: '50%', 
        background: 'radial-gradient(circle, var(--olive-green) 0%, var(--forest-green) 100%)', 
        border: '10px solid var(--gold-aged)', 
        boxShadow: '0 8px 30px rgba(0,0,0,0.6), inset 0 0 30px rgba(0,0,0,0.9)',
        display: 'flex', alignItems: 'center', justifyContent: 'center' 
      }}>
        {/* Grabados de la brújula */}
        <div style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: '2px dashed var(--gold-aged)', opacity: 0.35, padding: '20px' }}></div>
        <div style={{ position: 'absolute', color: 'var(--gold-aged)', top: '15px', fontFamily: 'var(--font-title)', fontSize: '1.3rem' }}>N</div>
        <div style={{ position: 'absolute', color: 'var(--gold-aged)', bottom: '15px', fontFamily: 'var(--font-title)', fontSize: '1.3rem' }}>S</div>
        <div style={{ position: 'absolute', color: 'var(--gold-aged)', right: '15px', fontFamily: 'var(--font-title)', fontSize: '1.3rem' }}>E</div>
        <div style={{ position: 'absolute', color: 'var(--gold-aged)', left: '15px', fontFamily: 'var(--font-title)', fontSize: '1.3rem' }}>O</div>
        
        <motion.div 
          animate={{ rotate: heading !== null ? heading : 0 }}
          transition={{ type: 'spring', damping: 12, stiffness: 40 }}
          style={{ position: 'absolute', color: 'var(--gold-aged)', filter: 'drop-shadow(0 0 15px rgba(184, 153, 71, 0.8))' }}
        >
          <Compass size={120} strokeWidth={1.2} />
        </motion.div>
        
        {heading === null && (
          <div style={{ position: 'absolute', bottom: '50px', color: 'var(--paper-bg)', fontSize: '1.1rem', textAlign: 'center', fontFamily: 'var(--font-hand)' }}>
            Alineando imán...<br/>GPS detectado.
          </div>
        )}
      </div>
      
      <div style={{ marginTop: '45px', textAlign: 'center' }}>
        <p style={{ fontSize: '1.5rem', color: 'var(--paper-bg)', fontFamily: 'var(--font-hand)' }}>Distancia al misterio</p>
        <motion.div 
          key={distance}
          initial={{ scale: 1.2, color: 'var(--gold-aged)' }}
          animate={{ scale: 1, color: 'var(--gold-aged)' }}
          style={{ fontSize: '4.5rem', fontWeight: 'bold', fontFamily: 'var(--font-title)', textShadow: '2px 2px 4px rgba(0,0,0,0.6)' }}
        >
          {distance !== null ? `${distance}m` : 'Buscando...'}
        </motion.div>
      </div>

      {distance !== null && distance < 15 && (
        <motion.button 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate(destination.nextUrl)}
          style={{ background: 'var(--forest-green)', color: 'var(--paper-bg)', border: '2px solid var(--gold-aged)', marginTop: '25px', boxShadow: '0 0 15px rgba(0,0,0,0.4)' }}
        >
          ¡Has llegado! Entrar
        </motion.button>
      )}

      {isModoPrueba && (
        <button 
          onClick={() => navigate(destination.nextUrl)}
          style={{ marginTop: '35px', padding: '10px 20px', background: 'transparent', border: '1px dashed var(--gold-aged)', color: 'var(--gold-aged)', fontSize: '1.1rem', boxShadow: 'none' }}
        >
          [Dev] Saltar la caminata
        </button>
      )}
    </div>
  );
};
