import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, getDoc, deleteDoc, query, orderBy } from "firebase/firestore";

// Credenciales de Firebase por defecto (vacías o del usuario).
// Si deseas enlazar tu proyecto de Firebase, rellena los campos aquí o usa variables de entorno en un archivo .env
const firebaseConfig = {
  apiKey: "AIzaSyDdFpYRLOe5yPXAaDwOdbsBPrHEZGl3e50",
  authDomain: "campamento-de-verano-80fbc.firebaseapp.com",
  projectId: "campamento-de-verano-80fbc",
  storageBucket: "campamento-de-verano-80fbc.firebasestorage.app",
  messagingSenderId: "43649083689",
  appId: "1:43649083689:web:f6d2f1ca98097c7f4d6f38",
  measurementId: "G-HT0PNB39C4"
};

// Validamos si la configuración es real
const isFirebaseConfigured = !!firebaseConfig.projectId;

let app;
let db: any = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    console.log("🔥 Firebase inicializado con éxito.");
  } catch (error) {
    console.error("Error al inicializar Firebase:", error);
  }
} else {
  console.warn("⚠️ Firebase no configurado. Utilizando sistema de almacenamiento local simulado (LocalStorage).");
}

// ==========================================
// MÉTODOS DE BASE DE DATOS DE LA GYMKANA
// ==========================================

export interface GrupoData {
  id?: string;
  groupName: string;
  participants: string;
  startTime: number;
  endTime?: number;
  totalTimeSeconds?: number;
  photo?: string; // Guardado como base64
  faseActual?: string;
}

// 1. Guardar o Registrar un Grupo
export const registrarGrupo = async (groupName: string, participants: string): Promise<string> => {
  const nuevoGrupo: GrupoData = {
    groupName,
    participants,
    startTime: Date.now()
  };

  if (db) {
    try {
      // Usar un timeout de 3 segundos para evitar que se quede colgado si Firebase falla/no responde
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout de Firebase")), 3000));
      const docRef = await Promise.race([
        addDoc(collection(db, "grupos"), nuevoGrupo),
        timeoutPromise
      ]) as any;
      return docRef.id;
    } catch (e) {
      console.error("Error registrando en Firestore (o timeout), reintentando local...", e);
    }
  }

  // Fallback Local
  const localId = "grupo_" + Math.random().toString(36).substr(2, 9);
  const localGrupos = JSON.parse(localStorage.getItem("gymkana_grupos") || "[]");
  localGrupos.push({ ...nuevoGrupo, id: localId });
  localStorage.setItem("gymkana_grupos", JSON.stringify(localGrupos));
  return localId;
};

// 2. Finalizar Prueba / Registrar Marca de Tiempo y Foto
export const finalizarGymkana = async (id: string, photoBase64: string): Promise<GrupoData> => {
  const endTime = Date.now();



  // Recuperar inicio del localStorage para garantizar cálculo de tiempo
  const startTime = Number(localStorage.getItem("gymkana_startTime") || Date.now().toString());
  const elapsedSeconds = Math.round((endTime - startTime) / 1000);

  const updates = {
    endTime,
    totalTimeSeconds: elapsedSeconds,
    photo: photoBase64
  };

  if (db) {
    try {
      const docRef = doc(db, "grupos", id);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout de Firebase")), 3000));
      await Promise.race([
        setDoc(docRef, updates, { merge: true }),
        timeoutPromise
      ]);
      console.log("✅ Datos y foto subidos a Firebase.");
    } catch (e) {
      console.error("Error guardando en Firestore (o timeout), guardando en local...", e);
    }
  }

  // Actualizar también localmente
  const localGrupos = JSON.parse(localStorage.getItem("gymkana_grupos") || "[]");
  let updatedGroup: GrupoData | null = null;
  const updatedLocal = localGrupos.map((g: GrupoData) => {
    if (g.id === id) {
      updatedGroup = { ...g, ...updates };
      return updatedGroup;
    }
    return g;
  });

  if (!updatedGroup) {
    // Si no existía, creamos uno básico
    updatedGroup = {
      id,
      groupName: localStorage.getItem("gymkana_groupName") || "Exploradores Anónimos",
      participants: localStorage.getItem("gymkana_participants") || "Exploradores",
      startTime,
      ...updates
    };
    updatedLocal.push(updatedGroup);
  }

  localStorage.setItem("gymkana_grupos", JSON.stringify(updatedLocal));
  return updatedGroup;
};

// 3. Obtener el Ranking Ordenado por Tiempo
export const obtenerRanking = async (): Promise<GrupoData[]> => {
  if (db) {
    try {
      const q = query(collection(db, "grupos"), orderBy("totalTimeSeconds", "asc"));
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout de Firebase")), 3000));
      const querySnapshot = await Promise.race([
        getDocs(q),
        timeoutPromise
      ]) as any;
      
      const ranking: GrupoData[] = [];
      querySnapshot.forEach((doc: any) => {
        const data = doc.data() as GrupoData;
        if (data.totalTimeSeconds) {
          ranking.push({ ...data, id: doc.id });
        }
      });
      if (ranking.length > 0) return ranking;
    } catch (e) {
      console.error("Error obteniendo ranking de Firebase (o timeout), usando local...", e);
    }
  }

  // Fallback Local
  const localGrupos = JSON.parse(localStorage.getItem("gymkana_grupos") || "[]") as GrupoData[];
  return localGrupos
    .filter((g) => g.totalTimeSeconds !== undefined)
    .sort((a, b) => (a.totalTimeSeconds || 0) - (b.totalTimeSeconds || 0));
};

// Helper para verificar tiempo restante para la salida del próximo grupo (20 min de diferencia)
export const obtenerTiempoSalidaProximoGrupo = (): { minutosRestantes: number; sePuedeSalir: boolean } => {
  const localGrupos = JSON.parse(localStorage.getItem("gymkana_grupos") || "[]") as GrupoData[];
  if (localGrupos.length === 0) {
    return { minutosRestantes: 0, sePuedeSalir: true };
  }

  // Buscar el grupo con el startTime más reciente
  const ultimosTiempos = localGrupos.map(g => g.startTime);
  const ultimoInicio = Math.max(...ultimosTiempos, 0);

  if (ultimoInicio === 0) return { minutosRestantes: 0, sePuedeSalir: true };

  const transcurridoMs = Date.now() - ultimoInicio;
  const intervaloMs = 20 * 60 * 1000; // 20 minutos

  if (transcurridoMs >= intervaloMs) {
    return { minutosRestantes: 0, sePuedeSalir: true };
  } else {
    const restanteMs = intervaloMs - transcurridoMs;
    const minutosRestantes = Math.ceil(restanteMs / 60000);
    return { minutosRestantes, sePuedeSalir: false };
  }
};

// 4. Actualizar fase del grupo en tiempo real
export const actualizarFaseGrupo = async (id: string, fase: string): Promise<void> => {
  if (!id || id === 'grupo_anonimo') return;
  const updates = { faseActual: fase };
  if (db) {
    try {
      const docRef = doc(db, "grupos", id);
      await setDoc(docRef, updates, { merge: true });
      console.log(`📡 Fase del grupo ${id} actualizada a: ${fase}`);
    } catch (e) {
      console.error("Error al actualizar la fase en Firestore:", e);
    }
  }

  // Fallback local
  try {
    const localGrupos = JSON.parse(localStorage.getItem("gymkana_grupos") || "[]") as GrupoData[];
    const updatedLocal = localGrupos.map((g: GrupoData) => {
      if (g.id === id) {
        return { ...g, ...updates };
      }
      return g;
    });
    localStorage.setItem("gymkana_grupos", JSON.stringify(updatedLocal));
  } catch (e) {
    console.error("Error al guardar fase localmente:", e);
  }
};

// 5. Obtener todos los grupos para el administrador
export const obtenerTodosLosGrupos = async (): Promise<GrupoData[]> => {
  if (db) {
    try {
      const querySnapshot = await getDocs(collection(db, "grupos"));
      const grupos: GrupoData[] = [];
      querySnapshot.forEach((doc: any) => {
        grupos.push({ ...doc.data(), id: doc.id });
      });
      // Ordenar por startTime descendente (los más nuevos primero)
      return grupos.sort((a, b) => b.startTime - a.startTime);
    } catch (e) {
      console.error("Error al obtener todos los grupos de Firebase:", e);
    }
  }

  // Fallback local
  try {
    const localGrupos = JSON.parse(localStorage.getItem("gymkana_grupos") || "[]") as GrupoData[];
    return localGrupos.sort((a, b) => b.startTime - a.startTime);
  } catch (e) {
    return [];
  }
};

// 6. Eliminar un grupo (para limpieza del admin)
export const eliminarGrupo = async (id: string): Promise<void> => {
  if (db) {
    try {
      await deleteDoc(doc(db, "grupos", id));
      console.log(`🗑️ Grupo ${id} eliminado de Firebase.`);
    } catch (e) {
      console.error("Error al eliminar el grupo de Firebase:", e);
    }
  }

  // Fallback local
  try {
    const localGrupos = JSON.parse(localStorage.getItem("gymkana_grupos") || "[]") as GrupoData[];
    const updatedLocal = localGrupos.filter((g) => g.id !== id);
    localStorage.setItem("gymkana_grupos", JSON.stringify(updatedLocal));
  } catch (e) {
    console.error("Error al eliminar grupo localmente:", e);
  }
};

// 7. Obtener estado de la gymkana (abierto/cerrado)
export const obtenerEstadoGymkana = async (): Promise<'abierto' | 'cerrado'> => {
  if (db) {
    try {
      const docRef = doc(db, "config", "gymkana");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.estado || 'abierto';
      }
    } catch (e) {
      console.error("Error al obtener estado de la gymkana, asumiendo abierto:", e);
    }
  }
  return (localStorage.getItem("gymkana_estado") as 'abierto' | 'cerrado') || 'abierto';
};

// 8. Guardar estado de la gymkana (abierto/cerrado)
export const guardarEstadoGymkana = async (estado: 'abierto' | 'cerrado'): Promise<void> => {
  if (db) {
    try {
      const docRef = doc(db, "config", "gymkana");
      await setDoc(docRef, { estado }, { merge: true });
      console.log(`🔒 Estado de la gymkana actualizado a: ${estado}`);
    } catch (e) {
      console.error("Error al guardar estado en Firebase:", e);
    }
  }
  localStorage.setItem("gymkana_estado", estado);
};
