// Importar Firebase SDK desde CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Credenciales del Firebase de tu Gymkana
const firebaseConfig = {
  apiKey: "AIzaSyDdFpYRLOe5yPXAaDwOdbsBPrHEZGl3e50",
  authDomain: "campamento-de-verano-80fbc.firebaseapp.com",
  projectId: "campamento-de-verano-80fbc",
  storageBucket: "campamento-de-verano-80fbc.firebasestorage.app",
  messagingSenderId: "43649083689",
  appId: "1:43649083689:web:f6d2f1ca98097c7f4d6f38",
  measurementId: "G-HT0PNB39C4"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Estado global local
let allGroups = [];

// Elementos del DOM
const rankingBody = document.getElementById('rankingBody');
const searchInput = document.getElementById('searchInput');
const diplomaModal = document.getElementById('diplomaModal');
const closeModal = document.getElementById('closeModal');
const diplomaImage = document.getElementById('diplomaImage');
const downloadLink = document.getElementById('downloadLink');

// Formatear segundos en formato HH:MM:SS
function formatSeconds(totalSeconds) {
  if (totalSeconds === undefined) return '--';
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${hrs > 0 ? hrs + 'h ' : ''}${mins}m ${secs}s`;
}

// Cargar datos de los grupos desde Firebase Firestore
async function cargarDatos() {
  try {
    const q = query(collection(db, "grupos"), orderBy("totalTimeSeconds", "asc"));
    const querySnapshot = await getDocs(q);
    
    allGroups = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Solo incluimos en el ranking a los grupos que han completado la prueba y tienen foto
      if (data.totalTimeSeconds && data.photo) {
        allGroups.push({ id: doc.id, ...data });
      }
    });

    renderRanking(allGroups);
  } catch (error) {
    console.error("Error al obtener datos de Firebase:", error);
    rankingBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; padding:30px; color:var(--danger-red); font-family:var(--font-hand); font-size:1.5rem;">
          ❌ No se pudo conectar con el tomo de expedición. Comprueba tu conexión a Internet o inténtalo de nuevo.
        </td>
      </tr>
    `;
  }
}

// Renderizar la tabla de clasificación
function renderRanking(grupos) {
  if (grupos.length === 0) {
    rankingBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; padding:30px; font-family:var(--font-hand); font-size:1.5rem; color:var(--ink-light);">
          Aún no hay escuadrones clasificados en el mural. ¡Sé el primero en reclamar la gloria!
        </td>
      </tr>
    `;
    return;
  }

  rankingBody.innerHTML = '';
  grupos.forEach((grupo, index) => {
    const tr = document.createElement('tr');
    
    // Asignar medallas o posición
    let positionText = `#${index + 1}`;
    if (index === 0) positionText = '🥇';
    else if (index === 1) positionText = '🥈';
    else if (index === 2) positionText = '🥉';

    tr.innerHTML = `
      <td class="position-cell">${positionText}</td>
      <td>
        <div class="group-name">${grupo.groupName}</div>
      </td>
      <td class="group-participants">${grupo.participants}</td>
      <td class="time-cell">${formatSeconds(grupo.totalTimeSeconds)}</td>
      <td>
        <button class="view-diploma-btn" data-id="${grupo.id}">📜 Ver Diploma</button>
      </td>
    `;
    rankingBody.appendChild(tr);
  });

  // Asignar listeners a los botones de diploma
  document.querySelectorAll('.view-diploma-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      abrirDiploma(id);
    });
  });
}

// Abrir modal de diploma
function abrirDiploma(id) {
  const grupo = allGroups.find(g => g.id === id);
  if (!grupo) return;

  diplomaImage.src = grupo.photo;
  downloadLink.href = grupo.photo;
  downloadLink.download = `${grupo.groupName.replace(/\s+/g, '_')}_diploma.png`;
  
  diplomaModal.style.display = 'flex';
}

// Cerrar modal
closeModal.addEventListener('click', () => {
  diplomaModal.style.display = 'none';
});

// Cerrar al hacer clic fuera del modal
window.addEventListener('click', (e) => {
  if (e.target === diplomaModal) {
    diplomaModal.style.display = 'none';
  }
});

// Filtrar en tiempo real por buscador
searchInput.addEventListener('input', (e) => {
  const searchVal = e.target.value.toLowerCase().trim();
  const filtered = allGroups.filter(g => 
    g.groupName.toLowerCase().includes(searchVal) || 
    g.participants.toLowerCase().includes(searchVal)
  );
  renderRanking(filtered);
});

// Inicializar la carga de datos
cargarDatos();
