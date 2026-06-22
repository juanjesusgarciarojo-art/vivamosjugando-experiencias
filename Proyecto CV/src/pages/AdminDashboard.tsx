import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, Play, CheckCircle, Clock, Trash2, Download, 
  Lock, RefreshCw, LogOut, CheckSquare, AlertTriangle, ToggleLeft, ToggleRight 
} from 'lucide-react';
import { 
  obtenerTodosLosGrupos, eliminarGrupo, 
  obtenerEstadoGymkana, guardarEstadoGymkana, type GrupoData 
} from '../firebase';

export const AdminDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [grupos, setGrupos] = useState<GrupoData[]>([]);
  const [estado, setEstado] = useState<'abierto' | 'cerrado'>('abierto');
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedGroupName, setSelectedGroupName] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    // Verificar si ya estaba autenticado en la sesión actual
    if (sessionStorage.getItem('admin_authenticated') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      cargarDatos();
      const interval = setInterval(cargarDatos, 15000); // Polling cada 15 segundos para tiempo real
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'C0m0iguales') {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
      setLoginError('');
    } else {
      setLoginError('❌ Contraseña incorrecta. Inténtalo de nuevo, explorador.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
    setPassword('');
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const allGroups = await obtenerTodosLosGrupos();
      setGrupos(allGroups);
      
      const configEstado = await obtenerEstadoGymkana();
      setEstado(configEstado);
    } catch (e) {
      console.error("Error al cargar datos en el dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEstado = async () => {
    const nuevoEstado = estado === 'abierto' ? 'cerrado' : 'abierto';
    setEstado(nuevoEstado);
    await guardarEstadoGymkana(nuevoEstado);
  };

  const handleEliminarGrupo = async (id: string | undefined, groupName: string) => {
    if (!id) return;
    if (window.confirm(`⚠️ ¿Estás completamente seguro de que deseas eliminar el grupo "${groupName}"? Esta acción borrará permanentemente sus tiempos, fotos y diploma de la base de datos.`)) {
      await eliminarGrupo(id);
      await cargarDatos();
    }
  };

  const formatSeconds = (totalSeconds: number | undefined) => {
    if (totalSeconds === undefined) return '--';
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs > 0 ? hrs + 'h ' : ''}${mins}m ${secs}s`;
  };

  const formatDateTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Calcular Estadísticas
  const totalRegistrados = grupos.length;
  const activos = grupos.filter(g => g.totalTimeSeconds === undefined).length;
  const completados = grupos.filter(g => g.totalTimeSeconds !== undefined).length;
  
  // Buscar mejor tiempo
  const mejoresTiempos = grupos
    .filter(g => g.totalTimeSeconds !== undefined)
    .sort((a, b) => (a.totalTimeSeconds || 0) - (b.totalTimeSeconds || 0));
  const mejorRecord = mejoresTiempos.length > 0 
    ? `${mejoresTiempos[0].groupName} (${formatSeconds(mejoresTiempos[0].totalTimeSeconds)})` 
    : 'N/A';

  // Render Lock Screen si no está autenticado
  if (!isAuthenticated) {
    return (
      <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="diary-page" 
          style={{ width: '100%', maxWidth: '420px', textAlign: 'center', border: '5px double var(--leather-brown)' }}
        >
          <Lock size={48} color="var(--leather-brown)" style={{ margin: '0 auto 15px' }} />
          <h1 style={{ fontSize: '2.2rem', marginBottom: '5px' }}>Acceso Guardián</h1>
          <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.3rem', color: 'var(--ink-light)', marginBottom: '20px' }}>
            Consola central protegida de la Gymkana. Introduce la contraseña del campamento.
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input 
              type="password" 
              placeholder="Escribe la contraseña..." 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ textAlign: 'center', fontSize: '1.4rem' }}
            />
            {loginError && <p style={{ fontSize: '1.1rem', color: 'var(--danger-red)', fontWeight: 'bold' }}>{loginError}</p>}
            
            <button type="submit" style={{ marginTop: '10px' }}>
              🔑 Desbloquear
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/')}
              style={{
                background: 'transparent',
                boxShadow: 'none',
                color: 'var(--leather-brown)',
                border: '2px solid var(--leather-brown)',
                fontSize: '1.1rem',
                padding: '8px',
                marginTop: '5px'
              }}
            >
              Volver a la Web
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 40px', display: 'flex', flexDirection: 'column', minHeight: '100vh', gap: '30px' }}>
      
      {/* Barra superior de administración */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', borderBottom: '3px solid var(--leather-brown)', paddingBottom: '15px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            🛠️ Consola del Guardián
          </h1>
          <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.3rem', color: 'var(--ink-light)', margin: 0 }}>
            Supervisión y control en tiempo real de la Gymkana
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={cargarDatos}
            style={{
              background: 'var(--leather-brown)',
              fontSize: '1.1rem',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refrescar
          </button>
          <button 
            onClick={() => navigate('/')}
            style={{
              background: 'var(--forest-green)',
              fontSize: '1.1rem',
              padding: '8px 16px'
            }}
          >
            Ver Web Principal
          </button>
          <button 
            onClick={handleLogout}
            style={{
              background: 'var(--danger-red)',
              fontSize: '1.1rem',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 0 #4a0000, 0 6px 10px rgba(0,0,0,0.4)',
              border: '2px solid #4a0000'
            }}
          >
            <LogOut size={16} /> Salir
          </button>
        </div>
      </div>

      {/* Panel de Estado y Switch */}
      <section className="diary-page" style={{ padding: '20px', border: '3px dashed var(--leather-brown)', background: 'rgba(255, 255, 255, 0.4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              background: estado === 'abierto' ? 'var(--forest-green)' : 'var(--danger-red)',
              color: '#white',
              padding: '15px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(0,0,0,0.1)'
            }}>
              {estado === 'abierto' ? <CheckSquare size={32} color="#fff" /> : <AlertTriangle size={32} color="#fff" />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--leather-brown)' }}>
                Estado de Inscripción de Equipos: <span style={{ color: estado === 'abierto' ? 'var(--forest-green)' : 'var(--danger-red)', textTransform: 'uppercase' }}>{estado}</span>
              </h3>
              <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', color: 'var(--ink-light)', margin: 0 }}>
                {estado === 'abierto' 
                  ? 'Los participantes pueden registrar nuevos grupos en la web principal y empezar el juego.' 
                  : 'Las inscripciones están bloqueadas. Los grupos actuales en juego pueden seguir, pero nadie nuevo puede entrar.'
                }
              </p>
            </div>
          </div>
          <div>
            <button
              onClick={handleToggleEstado}
              style={{
                background: estado === 'abierto' ? 'var(--danger-red)' : 'var(--forest-green)',
                boxShadow: estado === 'abierto' ? '0 5px 0 #4a0000' : '0 5px 0 #1b2d15',
                border: estado === 'abierto' ? '2px solid #4a0000' : '2px solid #1b2d15',
                fontSize: '1.4rem',
                padding: '10px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {estado === 'abierto' ? (
                <>
                  <ToggleLeft size={24} /> Cerrar Inscripciones
                </>
              ) : (
                <>
                  <ToggleRight size={24} /> Abrir Inscripciones
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Tarjetas de Estadísticas */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        
        <div className="diary-page" style={{ padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '15px', borderRadius: '8px' }}>
          <div style={{ color: 'var(--leather-brown)', background: 'rgba(92, 58, 33, 0.1)', padding: '10px', borderRadius: '8px' }}>
            <Users size={32} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--ink-light)' }}>Total Equipos</h4>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', fontFamily: 'var(--font-title)' }}>{totalRegistrados}</span>
          </div>
        </div>

        <div className="diary-page" style={{ padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '15px', borderRadius: '8px' }}>
          <div style={{ color: '#b89947', background: 'rgba(184, 153, 71, 0.15)', padding: '10px', borderRadius: '8px' }}>
            <Play size={32} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--ink-light)' }}>En Curso / Activos</h4>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', fontFamily: 'var(--font-title)', color: 'var(--leather-brown)' }}>{activos}</span>
          </div>
        </div>

        <div className="diary-page" style={{ padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '15px', borderRadius: '8px' }}>
          <div style={{ color: 'var(--forest-green)', background: 'rgba(45, 74, 34, 0.1)', padding: '10px', borderRadius: '8px' }}>
            <CheckCircle size={32} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--ink-light)' }}>Finalizados</h4>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', fontFamily: 'var(--font-title)', color: 'var(--forest-green)' }}>{completados}</span>
          </div>
        </div>

        <div className="diary-page" style={{ padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '15px', borderRadius: '8px' }}>
          <div style={{ color: 'var(--danger-red)', background: 'rgba(139, 0, 0, 0.1)', padding: '10px', borderRadius: '8px' }}>
            <Clock size={32} />
          </div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--ink-light)' }}>Mejor Marca 🏆</h4>
            <span 
              title={mejorRecord}
              style={{ 
                fontSize: mejorRecord.length > 20 ? '1.2rem' : '1.5rem', 
                fontWeight: 'bold', 
                color: 'var(--danger-red)',
                display: 'block',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {mejorRecord}
            </span>
          </div>
        </div>

      </section>

      {/* Tabla General de Equipos */}
      <section className="diary-page" style={{ padding: '20px 25px', display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '40px' }}>
        <h3 style={{ margin: 0, fontSize: '2rem', borderBottom: '2px solid var(--paper-dark)', paddingBottom: '10px' }}>
          📋 Expediciones Registradas
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--leather-brown)', color: 'var(--leather-brown)', fontFamily: 'var(--font-title)', fontSize: '1.1rem' }}>
                <th style={{ padding: '10px 8px' }}>Escuadrón</th>
                <th style={{ padding: '10px 8px' }}>Integrantes</th>
                <th style={{ padding: '10px 8px', width: '120px' }}>Hora Inicio</th>
                <th style={{ padding: '10px 8px', width: '140px' }}>Fase Actual</th>
                <th style={{ padding: '10px 8px', width: '140px' }}>Tiempo Transcurrido</th>
                <th style={{ padding: '10px 8px', width: '220px', textAlign: 'center' }}>Acciones y Control</th>
              </tr>
            </thead>
            <tbody style={{ fontFamily: 'var(--font-hand)', fontSize: '1.3rem' }}>
              {grupos.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px 0', color: 'var(--ink-light)', fontStyle: 'italic' }}>
                    No hay ningún equipo registrado en la base de datos actualmente.
                  </td>
                </tr>
              ) : (
                grupos.map((grupo) => {
                  const isFinished = grupo.totalTimeSeconds !== undefined;
                  
                  // Color e icono de la fase actual
                  let phaseBadgeBg = '#f5c6cb';
                  let phaseBadgeColor = '#721c24';
                  let phaseText = grupo.faseActual || 'Registro';
                  
                  if (phaseText === 'Registro' || phaseText === 'Inicio') {
                    phaseBadgeBg = 'rgba(122, 78, 45, 0.15)';
                    phaseBadgeColor = '#5c3a21';
                  } else if (phaseText === 'Prueba 1') {
                    phaseBadgeBg = 'rgba(184, 153, 71, 0.2)';
                    phaseBadgeColor = '#94752b';
                  } else if (phaseText === 'Prueba 2') {
                    phaseBadgeBg = 'rgba(45, 74, 34, 0.15)';
                    phaseBadgeColor = '#2d4a22';
                  } else if (phaseText === 'Prueba 3') {
                    phaseBadgeBg = 'rgba(78, 205, 196, 0.2)';
                    phaseBadgeColor = '#258880';
                  } else if (phaseText === 'Prueba 4') {
                    phaseBadgeBg = 'rgba(170, 59, 255, 0.15)';
                    phaseBadgeColor = '#802cb8';
                  } else if (phaseText === 'Haciendo Foto') {
                    phaseBadgeBg = 'rgba(139, 0, 0, 0.15)';
                    phaseBadgeColor = '#8b0000';
                  } else if (phaseText === 'Completado') {
                    phaseBadgeBg = 'rgba(184, 153, 71, 0.3)';
                    phaseBadgeColor = '#8a6d1c';
                    phaseText = 'Completado 🥇';
                  }

                  return (
                    <tr 
                      key={grupo.id} 
                      style={{ 
                        borderBottom: '1px solid var(--paper-dark)',
                        backgroundColor: isFinished ? 'rgba(45, 74, 34, 0.02)' : 'transparent'
                      }}
                    >
                      {/* Nombre */}
                      <td style={{ padding: '12px 8px', fontWeight: 'bold', color: 'var(--leather-brown)', fontSize: '1.4rem' }}>
                        {grupo.groupName}
                        {grupo.groupName.toLowerCase().trim() === 'prueba' && (
                          <span style={{ fontSize: '0.85rem', background: '#ccc', color: '#333', padding: '1px 5px', borderRadius: '4px', marginLeft: '6px', fontFamily: 'var(--font-text)', fontWeight: 'normal' }}>PROBANDO</span>
                        )}
                      </td>
                      
                      {/* Integrantes */}
                      <td style={{ padding: '12px 8px', color: 'var(--ink-light)', fontSize: '1.15rem' }} title={grupo.participants}>
                        {grupo.participants.length > 50 ? grupo.participants.substring(0, 47) + '...' : grupo.participants}
                      </td>
                      
                      {/* Hora Inicio */}
                      <td style={{ padding: '12px 8px', color: 'var(--ink-light)', fontSize: '1.1rem' }}>
                        {formatDateTime(grupo.startTime)}
                      </td>
                      
                      {/* Fase Actual */}
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          backgroundColor: phaseBadgeBg,
                          color: phaseBadgeColor,
                          fontWeight: 'bold',
                          fontSize: '1.05rem',
                          fontFamily: 'var(--font-text)'
                        }}>
                          {phaseText}
                        </span>
                      </td>

                      {/* Tiempo Transcurrido / Final */}
                      <td style={{ padding: '12px 8px', fontWeight: 'bold', color: isFinished ? 'var(--forest-green)' : 'var(--leather-brown)' }}>
                        {isFinished ? (
                          <span>{formatSeconds(grupo.totalTimeSeconds)}</span>
                        ) : (
                          <span style={{ fontStyle: 'italic', color: '#b89947' }}>En juego...</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td style={{ padding: '12px 8px', display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                        {isFinished && grupo.photo ? (
                          <button
                            onClick={() => {
                              setSelectedPhoto(grupo.photo || null);
                              setSelectedGroupName(grupo.groupName);
                            }}
                            style={{
                              fontSize: '0.95rem',
                              padding: '5px 10px',
                              background: 'var(--leather-brown)',
                              boxShadow: '0 2px 0 var(--ink-color)',
                              border: '1.5px solid var(--ink-color)'
                            }}
                          >
                            📜 Diploma
                          </button>
                        ) : (
                          <button
                            disabled
                            style={{
                              fontSize: '0.95rem',
                              padding: '5px 10px',
                              background: '#ccc',
                              color: '#666',
                              boxShadow: 'none',
                              border: '1.5px solid #999',
                              cursor: 'not-allowed',
                              opacity: 0.6
                            }}
                          >
                            Diploma
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleEliminarGrupo(grupo.id, grupo.groupName)}
                          style={{
                            fontSize: '0.95rem',
                            padding: '5px 10px',
                            background: 'var(--danger-red)',
                            boxShadow: '0 2px 0 #4a0000',
                            border: '1.5px solid #4a0000',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Trash2 size={12} /> Borrar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal del Diploma */}
      {selectedPhoto && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(44, 30, 22, 0.85)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}
        onClick={() => setSelectedPhoto(null)}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              background: 'var(--paper-bg)',
              border: '6px solid var(--leather-brown)',
              borderRadius: '8px',
              padding: '20px',
              maxWidth: '550px',
              width: '100%',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              position: 'relative',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón cerrar */}
            <span 
              style={{
                position: 'absolute',
                top: '10px',
                right: '15px',
                fontSize: '2rem',
                cursor: 'pointer',
                fontWeight: 'bold',
                color: 'var(--leather-brown)'
              }}
              onClick={() => setSelectedPhoto(null)}
            >
              &times;
            </span>

            <h3 style={{ fontSize: '2rem', marginBottom: '15px', color: 'var(--danger-red)' }}>
              📜 Diploma de Excelencia
            </h3>

            <div style={{
              border: '4px double var(--gold-aged)',
              padding: '8px',
              background: '#fff',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <img 
                src={selectedPhoto} 
                alt="Diploma de Aventura" 
                style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '2px' }} 
              />
            </div>

            <div style={{ marginTop: '20px' }}>
              <a 
                href={selectedPhoto} 
                download={`${selectedGroupName.replace(/\s+/g, '_')}_diploma.jpg`} 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  textDecoration: 'none',
                  background: 'var(--forest-green)',
                  color: 'var(--paper-bg)',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontFamily: 'var(--font-title)',
                  fontSize: '1.4rem',
                  border: '2px solid var(--ink-color)',
                  boxShadow: '0 4px 0 var(--ink-color)',
                  textTransform: 'uppercase'
                }}
              >
                <Download size={18} /> Descargar Diploma
              </a>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};
