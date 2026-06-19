import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Download, Star, Trophy, Clock, Users } from 'lucide-react';
import { finalizarGymkana, obtenerRanking, actualizarFaseGrupo, type GrupoData } from '../firebase';

export const Victoria: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [photo, setPhoto] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [elapsedTimeStr, setElapsedTimeStr] = useState('');
  const [ranking, setRanking] = useState<GrupoData[]>([]);

  // Información del grupo desde localStorage
  const groupId = localStorage.getItem("gymkana_groupId") || "grupo_anonimo";
  const groupName = localStorage.getItem("gymkana_groupName") || "Escuadrón Legendario";
  const participants = localStorage.getItem("gymkana_participants") || "Exploradores";
  const startTime = Number(localStorage.getItem("gymkana_startTime") || Date.now().toString());

  useEffect(() => {
    // Actualizar fase a "Haciendo Foto" al ingresar a la pantalla final
    if (groupId) {
      actualizarFaseGrupo(groupId, "Haciendo Foto");
    }

    // Calcular tiempo final transcurrido
    const now = Date.now();
    const diffMs = now - startTime;
    const diffSecs = Math.floor(diffMs / 1000);
    const hrs = Math.floor(diffSecs / 3600);
    const mins = Math.floor((diffSecs % 3600) / 60);
    const secs = diffSecs % 60;
    
    const timeStr = `${hrs > 0 ? hrs + 'h ' : ''}${mins}m ${secs}s`;
    setElapsedTimeStr(timeStr);

    // Cargar ranking inicial
    cargarRanking();
  }, [startTime, groupId]);

  const cargarRanking = async () => {
    try {
      const docs = await obtenerRanking();
      setRanking(docs);
    } catch (err) {
      console.error(err);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Error accessing camera: ", err);
      alert("No se pudo acceder a la cámara. Revisa los permisos de tu explorador.");
    }
  };

  const takePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        setLoading(true);
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        // Configurar dimensiones
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Invertir horizontalmente para modo espejo natural
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Restaurar contexto para escribir textos normales
        context.setTransform(1, 0, 0, 1, 0, 0);
        
        // --- DIBUJAR MARCO Y DIPLOMA TEMÁTICO ---
        // 1. Banner semi-transparente en la parte inferior
        const bannerHeight = 85;
        context.fillStyle = "rgba(44, 30, 22, 0.85)"; // Cuero oscuro translúcido
        context.fillRect(0, canvas.height - bannerHeight, canvas.width, bannerHeight);
        
        // 2. Línea divisoria dorada
        context.strokeStyle = "#b89947"; // Oro envejecido
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(0, canvas.height - bannerHeight);
        context.lineTo(canvas.width, canvas.height - bannerHeight);
        context.stroke();
        
        // 3. Escribir textos en el diploma
        context.fillStyle = "#f4ecd8"; // Color pergamino
        context.font = "bold 20px Georgia, serif";
        context.fillText(`🏆 Récord de Aventura: ${groupName.toUpperCase()}`, 20, canvas.height - 50);
        
        context.font = "italic 16px Georgia, serif";
        // Limitar participantes si es muy largo
        const truncatedParts = participants.length > 50 ? participants.substring(0, 47) + "..." : participants;
        context.fillText(`👥 Exploradores: ${truncatedParts}`, 20, canvas.height - 20);
        
        context.fillStyle = "#b89947"; // Dorado
        context.font = "bold 22px Georgia, serif";
        context.fillText(`⏱️ ${elapsedTimeStr}`, canvas.width - 150, canvas.height - 35);
        
        // Convertir a DataURL (base64) en JPEG comprimido para no exceder límite de 1MB de Firestore
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setPhoto(dataUrl);
        
        // Detener transmisión de cámara
        const stream = video.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
        setCameraActive(false);

        // Guardar foto y datos finales en Firebase / Local Mock
        try {
          await finalizarGymkana(groupId, dataUrl);
          await actualizarFaseGrupo(groupId, "Completado");
          await cargarRanking();
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d');
          if (context) {
            // Establecer dimensiones razonables basadas en la imagen (máx 800px)
            const maxDim = 800;
            let width = img.width;
            let height = img.height;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Dibujar la foto
            context.drawImage(img, 0, 0, width, height);
            
            // --- DIBUJAR MARCO Y DIPLOMA TEMÁTICO ---
            const bannerHeight = 85;
            context.fillStyle = "rgba(44, 30, 22, 0.85)"; // Cuero oscuro translúcido
            context.fillRect(0, canvas.height - bannerHeight, canvas.width, bannerHeight);
            
            context.strokeStyle = "#b89947"; // Oro envejecido
            context.lineWidth = 4;
            context.beginPath();
            context.moveTo(0, canvas.height - bannerHeight);
            context.lineTo(canvas.width, canvas.height - bannerHeight);
            context.stroke();
            
            context.fillStyle = "#f4ecd8"; // Color pergamino
            context.font = "bold 20px Georgia, serif";
            context.fillText(`🏆 Récord de Aventura: ${groupName.toUpperCase()}`, 20, canvas.height - 50);
            
            context.font = "italic 16px Georgia, serif";
            const truncatedParts = participants.length > 50 ? participants.substring(0, 47) + "..." : participants;
            context.fillText(`👥 Exploradores: ${truncatedParts}`, 20, canvas.height - 20);
            
            context.fillStyle = "#b89947"; // Dorado
            context.font = "bold 22px Georgia, serif";
            context.fillText(`⏱️ ${elapsedTimeStr}`, canvas.width - 150, canvas.height - 35);
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
            setPhoto(dataUrl);
            
            // Guardar en Firebase
            finalizarGymkana(groupId, dataUrl)
              .then(() => actualizarFaseGrupo(groupId, "Completado"))
              .then(() => cargarRanking())
              .catch(err => console.error("Error guardando en Firebase:", err))
              .finally(() => setLoading(false));
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const formatSeconds = (totalSeconds: number | undefined) => {
    if (totalSeconds === undefined) return '--';
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs > 0 ? hrs + 'h ' : ''}${mins}m ${secs}s`;
  };

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '30px' }}>
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.5 }}
        className="diary-page"
        style={{ width: '100%', maxWidth: '520px', textAlign: 'center', border: '8px solid var(--leather-brown)', background: 'var(--paper-bg)' }}
      >
        <Star size={64} color="var(--gold-aged)" fill="var(--gold-aged)" style={{ margin: '0 auto 10px', filter: 'drop-shadow(0 0 10px rgba(184, 153, 71, 0.8))' }} />
        <h1 style={{ fontSize: '2.5rem', color: 'var(--danger-red)' }}>¡LEYENDAS DEL CAMPAMENTO!</h1>
        <p style={{ fontSize: '1.6rem', marginBottom: '20px', color: 'var(--ink-light)' }}>¡Habéis completado el mapa del tesoro!</p>
        
        {!photo ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.4rem' }}>
              Dejad constancia visual de vuestro logro en el tomo de expedición. La foto se guardará en tu ficha y en el mural del campamento.
            </p>
            
            <div style={{ background: 'rgba(92, 58, 33, 0.1)', padding: '10px', borderRadius: '8px', border: '1px dashed var(--leather-brown)' }}>
              <p style={{ fontSize: '1.2rem', margin: 0, fontWeight: 'bold' }}>⏱️ Tiempo de Expedición: <span style={{ color: 'var(--danger-red)' }}>{elapsedTimeStr}</span></p>
            </div>
            
            {!cameraActive ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                <label 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '10px', 
                    cursor: 'pointer',
                    fontFamily: 'var(--font-title)',
                    background: 'linear-gradient(145deg, #7a4e2d, var(--leather-brown))',
                    color: 'var(--paper-bg)',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '1.5rem',
                    letterSpacing: '1px',
                    boxShadow: '0 6px 0 var(--ink-color), 0 10px 10px rgba(0,0,0,0.3)',
                    textTransform: 'uppercase',
                    border: '2px solid var(--ink-color)',
                    textAlign: 'center',
                    userSelect: 'none'
                  }}
                >
                  <Camera /> {loading ? "Procesando..." : "📸 Hacer o Subir Foto"}
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    onChange={handleFileUpload} 
                    disabled={loading}
                    style={{ display: 'none' }} 
                  />
                </label>

                {!!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) && (
                  <button 
                    onClick={startCamera} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '10px', 
                      background: 'transparent', 
                      color: 'var(--leather-brown)', 
                      border: '2px solid var(--leather-brown)', 
                      boxShadow: 'none',
                      fontSize: '1.2rem',
                      padding: '10px 20px'
                    }}
                  >
                    💻 Usar Cámara Web (PC)
                  </button>
                )}
              </div>
            ) : (
              <div style={{ position: 'relative', padding: '10px', background: '#fff', border: '4px solid var(--leather-brown)', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', transform: 'rotate(1deg)', borderRadius: '4px' }}>
                <video ref={videoRef} autoPlay playsInline style={{ width: '100%', transform: 'scaleX(-1)', borderRadius: '2px' }}></video>
                <button 
                  onClick={takePhoto} 
                  disabled={loading}
                  style={{ 
                    position: 'absolute', 
                    bottom: '20px', 
                    left: '50%', 
                    transform: 'translateX(-50%)', 
                    padding: '12px 24px', 
                    fontSize: '1.3rem',
                    background: 'var(--danger-red)',
                    boxShadow: '0 4px 0 #4a0000, 0 6px 10px rgba(0,0,0,0.4)',
                    color: 'white'
                  }}
                >
                  {loading ? "Dibujando pergamino..." : "📸 Capturar Recuerdo"}
                </button>
              </div>
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ position: 'relative', margin: '20px auto', width: 'fit-content', padding: '12px', background: '#f4ecd8', border: '5px solid var(--leather-brown)', boxShadow: '0 8px 25px rgba(0,0,0,0.3)', transform: 'rotate(-2deg)' }}>
              <img src={photo} alt="Selfie de expedición" style={{ width: '100%', maxWidth: '380px', borderRadius: '2px' }} />
              <div style={{ fontFamily: 'var(--font-title)', fontSize: '1.3rem', color: 'var(--leather-brown)', marginTop: '8px' }}>
                📜 DIPLOMA DE EXCELENCIA EXPLORADORA
              </div>
            </div>
            
            <p style={{ marginBottom: '20px', color: 'var(--forest-green)', fontWeight: 'bold', fontFamily: 'var(--font-hand)', fontSize: '1.5rem' }}>
              ¡Foto guardada con éxito con vuestro tiempo y subida al gran servidor del campamento!
            </p>
            
            <a href={photo} download={`${groupName}-diploma.png`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', textDecoration: 'none', background: 'var(--leather-brown)', color: 'var(--paper-bg)', padding: '12px 24px', borderRadius: '8px', fontSize: '1.4rem', fontFamily: 'var(--font-title)', boxShadow: '0 6px 0 var(--ink-color)', textTransform: 'uppercase', border: '2px solid var(--ink-color)' }}>
              <Download /> Descargar Diploma Local
            </a>

            <button 
              onClick={() => {
                localStorage.removeItem("gymkana_groupId");
                localStorage.removeItem("gymkana_groupName");
                localStorage.removeItem("gymkana_participants");
                localStorage.removeItem("gymkana_startTime");
                localStorage.removeItem("gymkana_modo_prueba");
                navigate("/");
              }} 
              style={{ 
                marginTop: '15px', 
                width: '100%',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '10px',
                background: 'linear-gradient(145deg, #2d4a22, var(--forest-green))', 
                boxShadow: '0 6px 0 #1b2d15, 0 10px 10px rgba(0,0,0,0.3)',
                border: '2px solid #1b2d15'
              }}
            >
              🔄 Registrar Nuevo Grupo
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* CLASIFICACIÓN / RANKING */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="diary-page"
        style={{ width: '100%', maxWidth: '520px', border: '5px double var(--leather-brown)', background: 'var(--paper-bg)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '15px' }}>
          <Trophy color="var(--gold-aged)" size={32} />
          <h2>Mural de Honor</h2>
        </div>
        <p style={{ color: 'var(--ink-light)', fontFamily: 'var(--font-hand)', fontSize: '1.2rem', marginBottom: '20px', textAlign: 'center' }}>
          Los escuadrones más rápidos del campamento de verano.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {ranking.length === 0 ? (
            <p style={{ textAlign: 'center', fontFamily: 'var(--font-hand)', fontSize: '1.3rem', color: 'var(--ink-light)' }}>
              Aún no hay escuadrones en el ranking. ¡Sé el primero en inscribirte!
            </p>
          ) : (
            ranking.map((g, index) => (
              <div 
                key={g.id || index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 15px',
                  background: index === 0 ? 'rgba(184, 153, 71, 0.15)' : 'rgba(92, 58, 33, 0.05)',
                  border: index === 0 ? '2px solid var(--gold-aged)' : '1px solid var(--paper-dark)',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ 
                    fontFamily: 'var(--font-title)', 
                    fontSize: '1.5rem', 
                    color: index === 0 ? 'var(--gold-aged)' : 'var(--leather-brown)',
                    width: '25px'
                  }}>
                    #{index + 1}
                  </span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.2rem', textAlign: 'left', color: 'var(--leather-brown)' }}>
                      {g.groupName}
                    </h4>
                    <span style={{ fontSize: '0.85rem', color: 'var(--ink-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={12} /> {g.participants.length > 35 ? g.participants.substring(0, 32) + '...' : g.participants}
                    </span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', color: 'var(--forest-green)', fontSize: '1.1rem' }}>
                  <Clock size={16} />
                  <span>{formatSeconds(g.totalTimeSeconds)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};
