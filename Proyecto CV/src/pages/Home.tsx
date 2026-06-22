import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Book, Hourglass, Lock } from 'lucide-react';
import { registrarGrupo, obtenerTiempoSalidaProximoGrupo, obtenerEstadoGymkana, actualizarFaseGrupo } from '../firebase';

export const Home: React.FC = () => {
  const [groupName, setGroupName] = useState('');
  const [participants, setParticipants] = useState('');
  const [loading, setLoading] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [salidaInfo, setSalidaInfo] = useState({ minutosRestantes: 0, sePuedeSalir: true });
  const navigate = useNavigate();

  useEffect(() => {
    // Comprobar si las inscripciones están abiertas
    const verificarEstado = async () => {
      try {
        const est = await obtenerEstadoGymkana();
        if (est === 'cerrado') {
          setIsClosed(true);
        }
      } catch (e) {
        console.error("Error comprobando estado de inscripciones:", e);
      }
    };
    verificarEstado();

    // Verificar si el grupo anterior salió hace poco
    const info = obtenerTiempoSalidaProximoGrupo();
    setSalidaInfo(info);
    
    // Polling rápido para actualizar el tiempo de espera
    const interval = setInterval(() => {
      setSalidaInfo(obtenerTiempoSalidaProximoGrupo());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName || !participants || loading) return;

    setLoading(true);
    try {
      // Doble comprobación del estado antes de registrar
      const est = await obtenerEstadoGymkana();
      if (est === 'cerrado') {
        alert("¡Lo sentimos! El guardián acaba de cerrar las inscripciones para esta gymkana.");
        setIsClosed(true);
        setLoading(false);
        return;
      }

      // Registrar grupo en Firebase / Local Mock
      const id = await registrarGrupo(groupName, participants);
      
      // Inicializar la fase del grupo en Firestore en "Registro"
      await actualizarFaseGrupo(id, "Registro");
      
      // Guardar sesión del grupo
      localStorage.setItem("gymkana_groupId", id);
      localStorage.setItem("gymkana_groupName", groupName);
      localStorage.setItem("gymkana_participants", participants);
      localStorage.setItem("gymkana_startTime", Date.now().toString());
      
      // Activar modo prueba
      if (groupName.trim().toLowerCase() === 'prueba') {
        localStorage.setItem("gymkana_modo_prueba", "true");
      } else {
        localStorage.removeItem("gymkana_modo_prueba");
      }
      
      // Ir a la primera prueba
      navigate('/prueba1');
    } catch (err) {
      console.error(err);
      alert("Error al iniciar el cuaderno mágico. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Render si las inscripciones están cerradas
  if (isClosed) {
    return (
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="diary-page" 
          style={{ width: '100%', maxWidth: '450px', textAlign: 'center', border: '5px double var(--leather-brown)' }}
        >
          <div style={{ color: 'var(--danger-red)', marginBottom: '15px' }}>
            <Lock size={48} strokeWidth={1.5} />
          </div>
          <h1 style={{ marginBottom: '10px', fontSize: '2.2rem', color: 'var(--danger-red)' }}>Inscripciones Cerradas</h1>
          <p style={{ marginBottom: '20px', color: 'var(--ink-light)', fontFamily: 'var(--font-hand)', fontSize: '1.4rem' }}>
            El guardián del campamento ha cerrado el acceso a esta aventura por el momento. ¡Pregúntale para comenzar!
          </p>
          <button 
            onClick={() => navigate('/')}
            style={{ width: '100%' }}
          >
            Volver a la Web
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <motion.div 
        initial={{ opacity: 0, rotate: -2, y: 20 }}
        animate={{ opacity: 1, rotate: 0, y: 0 }}
        className="diary-page" 
        style={{ width: '100%', maxWidth: '450px', textAlign: 'center', border: '5px double var(--leather-brown)' }}
      >
        <div style={{ color: 'var(--leather-brown)', marginBottom: '10px' }}>
          <Book size={48} strokeWidth={1.5} />
        </div>
        
        <h1 style={{ marginBottom: '5px', fontSize: '2.5rem' }}>Diario de Expedición</h1>
        <p style={{ marginBottom: '20px', color: 'var(--ink-light)', fontFamily: 'var(--font-hand)', fontSize: '1.4rem' }}>
          ¡Atención exploradores! Firmad el diario sagrado para dar comienzo a la gran gymkana del campamento.
        </p>

        {/* Alerta de intervalo de 20 min */}
        {!salidaInfo.sePuedeSalir && (
          <div style={{ 
            background: 'rgba(139, 0, 0, 0.1)', 
            border: '2px dashed var(--danger-red)', 
            borderRadius: '8px', 
            padding: '12px', 
            marginBottom: '20px',
            color: 'var(--danger-red)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            justifyContent: 'center',
            fontSize: '1.1rem',
            fontFamily: 'var(--font-text)',
            fontWeight: 'bold'
          }}>
            <Hourglass size={20} className="animate-spin" />
            <span>
              ¡Precaución! Grupo anterior en tránsito. <br/>
              Recomendable esperar {salidaInfo.minutosRestantes} min para no solaparos.
            </span>
          </div>
        )}
        
        <form onSubmit={handleStart} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <label style={{ fontFamily: 'var(--font-title)', fontSize: '1.2rem', color: 'var(--forest-green)', letterSpacing: '1px' }}>Nombre del Escuadrón</label>
            <input 
              type="text" 
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Ej: Los Halcones..."
              disabled={loading}
              required
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <label style={{ fontFamily: 'var(--font-title)', fontSize: '1.2rem', color: 'var(--forest-green)', letterSpacing: '1px' }}>Integrantes del Grupo</label>
            <textarea 
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              placeholder="Escribe los nombres de los valientes exploradores..."
              style={{ minHeight: '80px', resize: 'vertical', fontSize: '1.4rem' }}
              disabled={loading}
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              marginTop: '15px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '10px',
              opacity: loading ? 0.7 : 1
            }}
          >
            <Compass size={24} /> {loading ? "Conectando..." : "¡Iniciar Aventura!"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
