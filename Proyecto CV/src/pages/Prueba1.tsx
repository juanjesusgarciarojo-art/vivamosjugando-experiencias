import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Map, KeyRound, Check, X } from 'lucide-react';
import { actualizarFaseGrupo } from '../firebase';

export const Prueba1: React.FC = () => {
  const [code1, setCode1] = useState('');
  const [code2, setCode2] = useState('');
  const [code3, setCode3] = useState('');
  const [completed, setCompleted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const groupId = localStorage.getItem("gymkana_groupId");
    if (groupId) {
      actualizarFaseGrupo(groupId, "Prueba 1");
    }
  }, []);

  const [validation, setValidation] = useState<{c1: boolean|null, c2: boolean|null, c3: boolean|null}>({c1:null,c2:null,c3:null});

  const normalize = (s: string) => s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const isC1Correct = (val: string) => {
    const n = normalize(val);
    return n === "gradas" || n === "grada";
  };

  const isC2Correct = (val: string) => {
    const n = normalize(val);
    return n === "canasta de baloncesto" || n === "canasta";
  };

  const isC3Correct = (val: string) => {
    const n = normalize(val);
    return n === "no recuerdo que me han dicho" || n === "no recuerdo";
  };
  
  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    
    const val1 = isC1Correct(code1);
    const val2 = isC2Correct(code2);
    const val3 = isC3Correct(code3);

    setValidation({c1: val1, c2: val2, c3: val3});
    if (val1 && val2 && val3) {
      setTimeout(() => {
        setCompleted(true);
      }, 1500);
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
          <Map size={48} strokeWidth={1.5} />
        </div>
        
        <h2 style={{ marginBottom: '15px', fontSize: '2rem' }}>El inicio de un misterio y una gran aventura</h2>
        
        {!completed ? (
          <>
            {/* Contenedor del Avatar Animado */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
              <iframe
                width="315"
                height="560"
                src="https://www.youtube.com/embed/tEWuT914flI?autoplay=1&rel=0"
                title="Guardián 1"
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
              "Me dicen que debemos encontrar tres claves para poder continuar.<br/>1. Gradas<br/>2. Canasta de baloncesto<br/>3. No recuerdo que me han dicho"
            </p>
            
            <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="text" 
                  placeholder="Clave 1..." 
                  value={code1} 
                  onChange={(e) => setCode1(e.target.value)} 
                  required 
                  style={{ flex: 1, minWidth: 0, width: 'auto' }} 
                />
                <div style={{ width: '24px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                  {isC1Correct(code1) ? (
                    <Check color="var(--gold-aged)" size={24} />
                  ) : validation.c1 === false ? (
                    <X color="var(--danger-red)" size={24} />
                  ) : null}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="text" 
                  placeholder="Clave 2..." 
                  value={code2} 
                  onChange={(e) => setCode2(e.target.value)} 
                  required 
                  style={{ flex: 1, minWidth: 0, width: 'auto' }} 
                />
                <div style={{ width: '24px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                  {isC2Correct(code2) ? (
                    <Check color="var(--gold-aged)" size={24} />
                  ) : validation.c2 === false ? (
                    <X color="var(--danger-red)" size={24} />
                  ) : null}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="text" 
                  placeholder="Clave 3..." 
                  value={code3} 
                  onChange={(e) => setCode3(e.target.value)} 
                  required 
                  style={{ flex: 1, minWidth: 0, width: 'auto' }} 
                />
                <div style={{ width: '24px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                  {isC3Correct(code3) ? (
                    <Check color="var(--gold-aged)" size={24} />
                  ) : validation.c3 === false ? (
                    <X color="var(--danger-red)" size={24} />
                  ) : null}
                </div>
              </div>
              
              <button type="submit" style={{ marginTop: '20px' }}>
                Comprobar Notas
              </button>
            </form>
          </>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'relative' }}>
            <div className="stamp">COMPLETADO</div>
            <div style={{ color: 'var(--olive-green)', margin: '20px 0' }}>
              <KeyRound size={64} style={{ margin: '0 auto' }} />
            </div>
            <p style={{ margin: '20px 0', fontWeight: 'bold', fontFamily: 'var(--font-hand)', fontSize: '1.5rem' }}>
              ¡Excelente trabajo! Tenéis el primer fragmento del mapa ancestral.
            </p>
            
            <button onClick={() => navigate('/radar?dest=pumptrack')} style={{ width: '100%' }}>
              Usar Brújula Mágica
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
