// ============================================================
// LOGICA DE JUEGO PRINCIPAL (APP TEMPLATE)
// ============================================================

// TODO: Introduce aquí tus importaciones de SDK de Firebase
// import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
// import { getFirestore, doc, getDoc, updateDoc, onSnapshot, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Datos de configuración (Reemplazar por los de tu app de Firebase)
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};

// Variable de estado local
let TEAM_ID = ""; // Código introducido por el usuario
let db = null; // Instancia de base de datos
let timerInterval = null;

document.addEventListener("DOMContentLoaded", () => {
  setupAppEvents();
});

function setupAppEvents() {
  const btnLogin = document.getElementById("btn-login");
  const inputCode = document.getElementById("input-team-code");
  const btnSend = document.getElementById("btn-send-chat");
  const chatInput = document.getElementById("chat-input");
  const btnFinish = document.getElementById("btn-finish-mission");

  if (btnLogin && inputCode) {
    btnLogin.addEventListener("click", () => handleTeamLogin(inputCode.value.trim().toUpperCase()));
    inputCode.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleTeamLogin(inputCode.value.trim().toUpperCase());
    });
  }

  if (btnSend && chatInput) {
    btnSend.addEventListener("click", () => sendChatMessage(chatInput.value.trim()));
    chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") sendChatMessage(chatInput.value.trim());
    });
  }

  if (btnFinish) {
    btnFinish.addEventListener("click", finalizarPartida);
  }
}

/**
 * Valida el acceso del equipo en Firebase
 */
async function handleTeamLogin(code) {
  const errDiv = document.getElementById("login-error");
  if (!code) {
    showError("Por favor, introduce tu código de equipo.");
    return;
  }

  showError("Validando...", "#8b5cf6");

  try {
    // 1. Inicializar Firebase si aún no se ha hecho
    // const app = initializeApp(firebaseConfig);
    // db = getFirestore(app);

    // MOCK DE PRUEBA LOCAL (SI NO HAY FIREBASE CONECTADO AÚN)
    // En producción, consulta Firestore:
    // const docRef = doc(db, "grupos", code);
    // const snap = await getDoc(docRef);
    // if (!snap.exists()) { ... }
    
    // Simulación de éxito de Login para desarrollo local
    if (code === "DEMO") {
      TEAM_ID = code;
      localStorage.setItem("team_id", TEAM_ID);
      showLobbyScreen();
      
      // Auto-iniciar simulación de juego tras 3 segundos
      setTimeout(() => {
        iniciarPartidaSimulada();
      }, 3000);
      return;
    }

    // Si la conexión fallara o no fuera demo, avisar
    showError("Código inválido en modo sin conexión. Usa 'DEMO' para probar localmente.");

  } catch (err) {
    console.error("Error de conexión Firebase:", err);
    showError("Error de comunicación: " + err.message);
  }
}

function showError(msg, color = "#ef4444") {
  const errDiv = document.getElementById("login-error");
  errDiv.innerText = msg;
  errDiv.style.color = color;
  errDiv.style.display = "block";
}

/**
 * Muestra la pantalla de lobby
 */
function showLobbyScreen() {
  document.getElementById("screen-login").classList.remove("active");
  document.getElementById("screen-lobby").classList.add("active");
}

/**
 * Inicialización real del juego
 */
function iniciarPartidaSimulada() {
  document.getElementById("screen-lobby").classList.remove("active");
  document.getElementById("screen-game").classList.add("active");
  document.getElementById("display-team-name").innerText = `Equipo: ${TEAM_ID}`;
  
  // Reproducir sonido de éxito
  playAudio("snd-success");

  // Iniciar cronómetro de juego (Ej: 1 hora)
  let timeRemaining = 3600; // 60 minutos
  updateTimerUI(timeRemaining);

  timerInterval = setInterval(() => {
    timeRemaining--;
    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      timeRemaining = 0;
    }
    updateTimerUI(timeRemaining);
  }, 1000);
}

function updateTimerUI(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  const timerText = [
    h.toString().padStart(2, '0'),
    m.toString().padStart(2, '0'),
    s.toString().padStart(2, '0')
  ].join(':');

  document.getElementById("game-timer").innerText = timerText;
}

/**
 * Enviar mensaje de chat
 */
function sendChatMessage(text) {
  if (!text) return;
  
  const input = document.getElementById("chat-input");
  input.value = "";

  appendMessage("Tú", text, "player");

  // En producción, envía el mensaje a Firebase:
  // const msgRef = collection(db, "grupos", TEAM_ID, "mensajes");
  // await addDoc(msgRef, {
  //   remitente: "player",
  //   texto: text,
  //   fecha: serverTimestamp()
  // });

  // Simulación de respuesta automática de HQ para pruebas locales
  setTimeout(() => {
    appendMessage("HQ", "Recibido. Analizando directivas. Mantente a la espera.", "hq");
    playAudio("snd-success");
  }, 1500);
}

function appendMessage(sender, text, type) {
  const container = document.getElementById("chat-messages-container");
  const div = document.createElement("div");
  div.className = `msg ${type}`;
  div.innerHTML = `<strong>${sender}:</strong> ${text}`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

/**
 * Reproductor de Sonidos HTML5
 */
function playAudio(id) {
  const snd = document.getElementById(id);
  if (snd) {
    snd.currentTime = 0;
    snd.play().catch(() => {});
  }
}

/**
 * Finalizar la partida
 */
function finalizarPartida() {
  const code = prompt("ATENCIÓN: CÓDIGO DE FINALIZACIÓN REQUERIDO.\nPor favor, introduzca el código de fin de misión:");
  if (code === null) return;

  if (code.trim().toUpperCase() === "FINALIZAR") {
    clearInterval(timerInterval);
    alert("¡Misión Completada! El juego ha finalizado correctamente.");
    localStorage.clear();
    window.location.reload();
  } else {
    playAudio("snd-error");
    alert("Código incorrecto.");
  }
}
