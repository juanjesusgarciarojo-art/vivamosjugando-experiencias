import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Clock, Search, Download, Mail, Lock, Sparkles, RefreshCw } from 'lucide-react';
import { obtenerRanking, obtenerEstadoGymkana, type GrupoData } from '../firebase';

export const Landing: React.FC = () => {
  const [ranking, setRanking] = useState<GrupoData[]>([]);
  const [filteredRanking, setFilteredRanking] = useState<GrupoData[]>([]);
  const [searchVal, setSearchVal] = useState('');
  const [estado, setEstado] = useState<'abierto' | 'cerrado'>('abierto');
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedGroupName, setSelectedGroupName] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const docs = await obtenerRanking();
      // Solo incluimos en el ranking a los grupos que tienen tiempo registrado y foto
      const completados = docs.filter(g => g.totalTimeSeconds !== undefined && g.photo);
      setRanking(completados);
      setFilteredRanking(completados);
      
      const resEstado = await obtenerEstadoGymkana();
      setEstado(resEstado);
    } catch (e) {
      console.error("Error cargando datos de la landing:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchVal(val);
    const lower = val.toLowerCase().trim();
    const filtered = ranking.filter(g => 
      g.groupName.toLowerCase().includes(lower) || 
      g.participants.toLowerCase().includes(lower)
    );
    setFilteredRanking(filtered);
  };

  const formatSeconds = (totalSeconds: number | undefined) => {
    if (totalSeconds === undefined) return '--';
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs > 0 ? hrs + 'h ' : ''}${mins}m ${secs}s`;
  };

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', gap: '30px' }}>
      
      {/* Botón flotante oculto/discreto de administración */}
      <div style={{ position: 'fixed', top: '15px', left: '15px', zIndex: 100 }}>
        <button 
          onClick={() => navigate('/admin')}
          style={{
            background: 'rgba(92, 58, 33, 0.4)',
            color: 'var(--paper-bg)',
            border: '1px solid rgba(74, 54, 41, 0.3)',
            boxShadow: 'none',
            fontSize: '1rem',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            opacity: 0.6,
            borderRadius: '20px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
        >
          <Lock size={14} /> Panel Guardián
        </button>
      </div>

      {/* Botón flotante para Volver a la Web Principal */}
      <div style={{ position: 'fixed', top: '15px', right: '160px', zIndex: 1000 }}>
        <button 
          onClick={() => window.location.href = '../index.html'}
          style={{
            background: 'linear-gradient(145deg, #2d4a22, var(--forest-green))',
            color: 'var(--paper-bg)',
            border: '2px solid #1b2d15',
            boxShadow: '0 4px 0 #1b2d15',
            fontSize: '1.1rem',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            borderRadius: '8px',
            fontFamily: 'var(--font-title)',
            fontWeight: 'bold',
            textTransform: 'uppercase'
          }}
        >
          ← Volver a Vivamos Jugando
        </button>
      </div>

      {/* Encabezado Principal */}
      <header style={{ textAlign: 'center', marginTop: '20px' }}>
        <motion.h1 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{ fontSize: '3.5rem', marginBottom: '5px' }}
        >
          MURAL DE HONOR
        </motion.h1>
        <motion.h2 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{ fontFamily: 'var(--font-hand)', fontSize: '2rem', color: 'var(--ink-light)', textShadow: 'none' }}
        >
          ¡Grandes Expedicionarios de la Gymkana!
        </motion.h2>
      </header>

      {/* Zona de Bienvenida y Publicidad Sutil */}
      <section style={{ width: '100%', maxWidth: '750px' }}>
        <div className="diary-page" style={{ display: 'flex', flexDirection: 'row', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          <div style={{ flex: '1 1 180px', display: 'flex', justifyContent: 'center' }}>
            <img 
              src="./avatar-web.png" 
              alt="Avatar de la Web" 
              style={{ 
                width: '100%', 
                maxWidth: '180px', 
                borderRadius: '50%', 
                border: '4px solid var(--leather-brown)',
                boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                background: 'var(--paper-dark)'
              }} 
            />
          </div>

          <div style={{ flex: '2 1 350px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.4)',
              border: '2px solid var(--paper-dark)',
              borderRadius: '12px',
              padding: '15px',
              position: 'relative',
              boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)'
            }}>
              <p style={{ fontSize: '1.3rem', margin: 0, fontStyle: 'italic', color: 'var(--ink-color)' }}>
                "¡Saludos, valientes exploradores! En este gran mural podréis ver los récords de los escuadrones que completaron la gymkana. Buscad vuestro grupo y descargad vuestro <strong>Diploma de Excelencia</strong> para enmarcar vuestra hazaña."
              </p>
            </div>

            <div style={{
              background: 'rgba(92, 58, 33, 0.05)',
              border: '1px solid var(--paper-dark)',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <h3 style={{ fontSize: '1.4rem', margin: 0, color: 'var(--forest-green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Organizado por <a href="https://www.vivamosjugando.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--leather-brown)', textDecoration: 'underline' }}>Vivamos Jugando</a>
              </h3>
              <p style={{ fontSize: '1.1rem', margin: 0, lineHeight: '1.3' }}>
                Diseñamos experiencias únicas para conectar a familias a través del juego y la aventura. 
                En breve publicaremos nuevos talleres y emocionantes actividades temáticas conjuntas para padres y niños. 
                ¡Síguenos en nuestra web para no perderte nada!
              </p>
              <div style={{ fontSize: '1.1rem', marginTop: '4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={16} /> <a href="mailto:contacto@vivamosjugando.com" style={{ color: 'var(--leather-brown)' }}>contacto@vivamosjugando.com</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Botón Principal para Jugar (Condicionado) */}
      <section style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        {estado === 'abierto' ? (
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/registro')}
            style={{ 
              width: '100%', 
              background: 'linear-gradient(145deg, #2d4a22, var(--forest-green))', 
              boxShadow: '0 6px 0 #1b2d15, 0 10px 10px rgba(0,0,0,0.3)',
              border: '2px solid #1b2d15',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            <Sparkles size={24} /> ¡Iniciar Gymkana!
          </motion.button>
        ) : (
          <div>
            <button 
              disabled 
              style={{ 
                width: '100%', 
                background: '#4a433f', 
                color: '#a39b97',
                boxShadow: 'none', 
                border: '2px solid #2c2725',
                cursor: 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                opacity: 0.8
              }}
            >
              🔒 Inscripciones Cerradas
            </button>
            <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', marginTop: '10px', color: 'var(--danger-red)', fontWeight: 'bold' }}>
              El Guardián ha cerrado el acceso a nuevas inscripciones. <br />
              ¡Pregúntale al organizador para comenzar una partida!
            </p>
          </div>
        )}
      </section>

      {/* Buscador de Grupos */}
      <section style={{ width: '100%', maxWidth: '750px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '15px', 
          background: 'rgba(255, 255, 255, 0.5)', 
          padding: '8px 20px', 
          borderRadius: '30px', 
          border: '2px solid var(--paper-dark)',
          boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
        }}>
          <Search size={22} color="var(--ink-light)" />
          <input 
            type="text" 
            placeholder="Buscar por nombre de escuadrón o participantes..." 
            value={searchVal}
            onChange={handleSearchChange}
            style={{ 
              border: 'none', 
              fontSize: '1.4rem', 
              background: 'transparent',
              padding: '4px 0',
              fontFamily: 'var(--font-hand)'
            }}
          />
          {ranking.length > 0 && (
            <button 
              onClick={cargarDatos} 
              style={{ 
                background: 'transparent', 
                color: 'var(--ink-light)',
                border: 'none',
                boxShadow: 'none',
                padding: '4px',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          )}
        </div>
      </section>

      {/* Tabla de Clasificación */}
      <section style={{ width: '100%', maxWidth: '750px', marginBottom: '40px' }}>
        <div className="diary-page" style={{ padding: '20px 25px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', justifyContent: 'center' }}>
            <Trophy color="var(--gold-aged)" size={32} />
            <h3 style={{ margin: 0, fontSize: '2rem' }}>Tabla de Clasificación</h3>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
              <thead>
                <tr style={{ borderBottom: '3px solid var(--leather-brown)', color: 'var(--leather-brown)', fontFamily: 'var(--font-title)', fontSize: '1.2rem' }}>
                  <th style={{ padding: '12px 8px', width: '90px' }}>Puesto</th>
                  <th style={{ padding: '12px 8px' }}>Escuadrón</th>
                  <th style={{ padding: '12px 8px' }}>Integrantes</th>
                  <th style={{ padding: '12px 8px', width: '150px' }}>Tiempo Total</th>
                  <th style={{ padding: '12px 8px', width: '150px', textAlign: 'center' }}>Diploma</th>
                </tr>
              </thead>
              <tbody style={{ fontFamily: 'var(--font-hand)', fontSize: '1.3rem' }}>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px 0' }}>
                      <div className="animate-spin" style={{ display: 'inline-block', width: '30px', height: '30px', border: '4px solid var(--leather-brown)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                      <p style={{ marginTop: '10px', fontSize: '1.3rem' }}>Abriendo el tomo de expedición...</p>
                    </td>
                  </tr>
                ) : filteredRanking.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '30px 0', color: 'var(--ink-light)', fontStyle: 'italic' }}>
                      Aún no hay escuadrones clasificados en el mural. ¡Sé el primero en reclamar la gloria!
                    </td>
                  </tr>
                ) : (
                  filteredRanking.map((grupo, index) => {
                    let posText: React.ReactNode = `#${index + 1}`;
                    if (index === 0) posText = '🥇';
                    else if (index === 1) posText = '🥈';
                    else if (index === 2) posText = '🥉';

                    return (
                      <tr key={grupo.id || index} style={{ borderBottom: '1px solid var(--paper-dark)' }}>
                        <td style={{ padding: '12px 8px', fontWeight: 'bold', fontSize: '1.5rem', color: index < 3 ? 'inherit' : 'var(--ink-light)' }}>
                          {posText}
                        </td>
                        <td style={{ padding: '12px 8px', fontWeight: 'bold', color: 'var(--leather-brown)' }}>
                          {grupo.groupName}
                        </td>
                        <td style={{ padding: '12px 8px', color: 'var(--ink-light)', fontSize: '1.2rem' }}>
                          {grupo.participants}
                        </td>
                        <td style={{ padding: '12px 8px', fontWeight: 'bold', color: 'var(--forest-green)' }}>
                          <Clock size={16} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                          {formatSeconds(grupo.totalTimeSeconds)}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                          <button
                            onClick={() => {
                              setSelectedPhoto(grupo.photo || null);
                              setSelectedGroupName(grupo.groupName);
                            }}
                            style={{
                              fontSize: '1.1rem',
                              padding: '6px 12px',
                              boxShadow: '0 3px 0 var(--ink-color)',
                              background: 'var(--leather-brown)',
                              border: '1.5px solid var(--ink-color)'
                            }}
                          >
                            📜 Ver
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Modal del Diploma */}
      {selectedPhoto && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(44, 30, 22, 0.8)',
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
