/* ============================================================
   COMOIGUALES — dashboard.js
   Lógica del Cuadro de Mando del Proyecto Vivamos Jugando
   ============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  addDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  deleteDoc, 
  updateDoc,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. Configuración de Firebase (Proyecto: el-reto-de-tu-vida)
const firebaseConfig = {
  apiKey: "AIzaSyDC93yT8bBGZvzz6TTjngY7rTX-vgT-rTw",
  authDomain: "el-reto-de-tu-vida.firebaseapp.com",
  projectId: "el-reto-de-tu-vida",
  storageBucket: "el-reto-de-tu-vida.firebasestorage.app",
  messagingSenderId: "436879361667",
  appId: "1:436879361667:web:94dffea44b14787d057db6"
};

// Inicialización de Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Estado global de la aplicación
let currentUserProfile = null;
let currentTab = "nuevo"; // Para buzón
let reservations = [];
let clients = [];
let gestores = [];
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

// Estado global de la Operación Enigma
let enigmaGroupUnsub = null;
let enigmaMembersUnsub = null;
let enigmaChatUnsub = null;
let enigmaContactsUnsub = null;
let enigmaTimerInterval = null;
const ENIGMA_GROUP_ID = "grupo_activo";

const MONTHS_SPANISH = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

// ============================================================
// 2. CONTROL DE ACCESO (AUTENTICACIÓN Y ROLES)
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  initDateHeader();
  checkFirstAdminSetup();

  // Listeners de Autenticación
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("Sesión activa para UID:", user.uid);
      try {
        const userDoc = await getDoc(doc(db, "usuarios_dashboard", user.uid));
        if (userDoc.exists()) {
          currentUserProfile = { uid: user.uid, ...userDoc.data() };
          console.log("Perfil del usuario cargado:", currentUserProfile);
          setupDashboardUI();
        } else {
          // Si el usuario existe en Auth pero no tiene ficha en Firestore, bloqueamos acceso
          showAuthError("Tu cuenta no está autorizada para acceder a este panel. Contacta al administrador.");
          await signOut(auth);
        }
      } catch (err) {
        console.error("Error al obtener perfil del usuario:", err);
        showAuthError("Error de conexión. Inténtalo de nuevo.");
        await signOut(auth);
      }
    } else {
      console.log("No hay sesión activa.");
      showLoginScreen();
    }
  });

  // Envío Formulario de Iniciar Sesión
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const pass = document.getElementById("loginPassword").value;
    hideAuthError();

    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
      console.error("Error de login:", err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        showAuthError("Credenciales incorrectas. Verifica tu email y contraseña.");
      } else {
        showAuthError("Error al iniciar sesión: " + err.message);
      }
    }
  });

  // Envío Formulario de Onboarding Primer Administrador
  document.getElementById("setupForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nombre = document.getElementById("setupNombre").value.trim();
    const email = document.getElementById("setupEmail").value.trim();
    const pass = document.getElementById("setupPassword").value;
    hideAuthError();

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, pass);
      const user = userCred.user;

      // Crear perfil en Firestore como Admin
      await setDoc(doc(db, "usuarios_dashboard", user.uid), {
        nombre,
        email,
        rol: "admin",
        fecha_creacion: serverTimestamp()
      });

      // Crear log de auditoría
      await logAction(nombre, "admin", "Primer Onboarding", `Registró la cuenta de Administrador principal.`);
      
      console.log("Primer administrador creado con éxito.");
    } catch (err) {
      console.error("Error en onboarding:", err);
      showAuthError("Error al registrar Administrador: " + err.message);
    }
  });

  // Botón de Cerrar Sesión
  document.getElementById("logoutBtn").addEventListener("click", async () => {
    if (confirm("¿Estás seguro de que quieres cerrar sesión?")) {
      await signOut(auth);
    }
  });

  // Toggle Sidebar (Contraer/Expandir menú)
  const sidebarToggleBtn = document.getElementById("sidebarToggleBtn");
  const dashboardContainer = document.getElementById("dashboardScreen");
  const sidebarOverlay = document.getElementById("sidebarOverlay");

  if (sidebarToggleBtn && dashboardContainer) {
    sidebarToggleBtn.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        dashboardContainer.classList.toggle("sidebar-open");
      } else {
        dashboardContainer.classList.toggle("sidebar-collapsed");
      }
    });
  }

  if (sidebarOverlay && dashboardContainer) {
    sidebarOverlay.addEventListener("click", () => {
      dashboardContainer.classList.remove("sidebar-open");
    });
  }

  // Navegación Sidebar
  document.querySelectorAll(".nav-item").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetView = link.getAttribute("data-target");
      switchView(targetView);

      document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
      link.classList.add("active");

      // Cerrar menú lateral en móviles tras hacer clic
      if (dashboardContainer) {
        dashboardContainer.classList.remove("sidebar-open");
      }
    });
  });
});

// Verifica si la colección de usuarios está vacía para mostrar el setup
async function checkFirstAdminSetup() {
  try {
    const qSnap = await getDocs(query(collection(db, "usuarios_dashboard"), limit(1)));
    if (qSnap.empty) {
      document.getElementById("loginForm").style.display = "none";
      document.getElementById("setupForm").style.display = "block";
    } else {
      document.getElementById("loginForm").style.display = "block";
      document.getElementById("setupForm").style.display = "none";
    }
  } catch (err) {
    console.error("Error comprobando onboarding:", err);
  }
}

function showLoginScreen() {
  document.getElementById("dashboardScreen").style.display = "none";
  document.getElementById("authScreen").style.display = "flex";
  currentUserProfile = null;
  checkFirstAdminSetup();
}

function showAuthError(msg) {
  const errDiv = document.getElementById("authError");
  errDiv.innerText = msg;
  errDiv.style.display = "block";
}

function hideAuthError() {
  document.getElementById("authError").style.display = "none";
}

function initDateHeader() {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById("headerDate").innerText = new Date().toLocaleDateString('es-ES', options);
}

// ============================================================
// 3. VISTAS Y NAVEGACIÓN
// ============================================================

function switchView(viewId) {
  document.querySelectorAll(".dashboard-view").forEach(view => view.classList.remove("active"));
  document.getElementById(viewId).classList.add("active");

  // Al salir de la vista de experiencias, volvemos a la pantalla de selección y apagamos listeners
  if (viewId !== "view-experiencias") {
    const selector = document.getElementById("enigma-selector-screen");
    const consoleScreen = document.getElementById("enigma-console-screen");
    if (selector && consoleScreen) {
      selector.style.display = "grid";
      consoleScreen.style.display = "none";
    }
    stopEnigmaListeners();
  }

  // Actualizar Título
  const titleMap = {
    "view-inicio": ["Inicio", "Resumen general y próximas tareas"],
    "view-calendario": ["Calendario", "Planificación de experiencias contratadas"],
    "view-experiencias": ["Gestor de Experiencias", "Controla los juegos activos e interactúa con los jugadores"],
    "view-buzon": ["Buzón de Solicitudes", "Gestiona correos de información y encargos"],
    "view-clientes": ["Base de Datos de Clientes", "Fidelización de usuarios y marketing de ComoIguales"],
    "view-gestores": ["Gestión del Equipo", "Lista de gestores y alta de nuevos miembros"],
    "view-auditoria": ["Historial de Auditoría", "Registro en tiempo real de operaciones administrativas"]
  };

  if (titleMap[viewId]) {
    document.getElementById("viewTitle").innerText = titleMap[viewId][0];
    document.getElementById("viewSubtitle").innerText = titleMap[viewId][1];
  }
}

// Configuración visual según Rol
function setupDashboardUI() {
  document.getElementById("authScreen").style.display = "none";
  document.getElementById("dashboardScreen").style.display = "flex";

  // Rellenar cabecera de usuario
  document.getElementById("userName").innerText = currentUserProfile.nombre;
  document.getElementById("userRole").innerText = currentUserProfile.rol === "admin" ? "Administrador" : "Gestor";

  // Aplicar rol en body para CSS
  document.body.className = "";
  if (currentUserProfile.rol === "admin") {
    document.body.classList.add("role-admin");
  } else {
    document.body.classList.add("role-gestor");
  }

  // Cargar Listeners en tiempo real para Datos
  startDataListeners();
  setupCalendarEvents();
  setupMailboxEvents();
  setupClientEvents();
  setupGestoresForm();
  setupEnigmaEvents();
}

// Registrar Auditoría
async function logAction(userNombre, userRol, accion, detalles) {
  try {
    await addDoc(collection(db, "historial_acciones"), {
      usuario_nombre: userNombre,
      usuario_rol: userRol,
      accion: accion,
      detalles: detalles,
      fecha: serverTimestamp()
    });
  } catch (err) {
    console.error("Error al registrar auditoría:", err);
  }
}

// ============================================================
// 4. SUSCRIPCIONES A BASE DE DATOS (SNAPSHOT LISTENERS)
// ============================================================

function startDataListeners() {
  const isSearchAdmin = currentUserProfile.rol === "admin";

  // 1. SOLICITUDES DE CONTACTO
  if (isSearchAdmin) {
    onSnapshot(query(collection(db, "solicitudes_contacto"), orderBy("fecha_solicitud", "desc")), (snap) => {
      const allRequests = [];
      let countNuevos = 0;
      snap.forEach(doc => {
        const data = doc.data();
        if (data.estado === "nuevo") countNuevos++;
        allRequests.push({ id: doc.id, ...data });
      });

      // Actualizar contador del menú
      const badge = document.getElementById("badgeBuzon");
      const statNuevos = document.getElementById("statNuevos");
      if (badge) {
        if (countNuevos > 0) {
          badge.innerText = countNuevos;
          badge.style.display = "inline-block";
        } else {
          badge.style.display = "none";
        }
      }
      if (statNuevos) statNuevos.innerText = countNuevos;

      // Renderizar Buzón
      renderMailbox(allRequests);
      renderPendingRequests(allRequests.filter(r => r.estado === "nuevo"));
    });
  }

  // 2. RESERVAS (CALENDARIO)
  onSnapshot(query(collection(db, "reservas"), orderBy("fecha", "asc")), (snap) => {
    reservations = [];
    snap.forEach(doc => {
      reservations.push({ id: doc.id, ...doc.data() });
    });

    // Renderizar Calendario y Siguientes Eventos
    renderCalendar();
    renderNextEvents();
    renderStats();
  });

  // 3. CLIENTES
  if (isSearchAdmin) {
    onSnapshot(query(collection(db, "clientes"), orderBy("nombre", "asc")), (snap) => {
      clients = [];
      snap.forEach(doc => {
        clients.push({ email: doc.id, ...doc.data() });
      });

      renderClients();
      renderStats();
    });
  }

  // 4. EQUIPO DE GESTORES
  onSnapshot(query(collection(db, "usuarios_dashboard"), orderBy("nombre", "asc")), (snap) => {
    gestores = [];
    const select = document.getElementById("resGestor");
    select.innerHTML = '<option value="">Selecciona un gestor...</option>';

    snap.forEach(doc => {
      const data = doc.data();
      const gest = { uid: doc.id, ...data };
      gestores.push(gest);
      
      // Llenar select del modal de reserva
      const opt = document.createElement("option");
      opt.value = gest.uid;
      opt.innerText = `${gest.nombre} (${gest.rol === "admin" ? "Admin" : "Gestor"})`;
      select.appendChild(opt);
    });

    renderGestores();
  });

  // 5. HISTORIAL DE AUDITORÍA
  if (isSearchAdmin) {
    onSnapshot(query(collection(db, "historial_acciones"), orderBy("fecha", "desc"), limit(50)), (snap) => {
      const auditDiv = document.getElementById("auditListItems");
      auditDiv.innerHTML = "";

      if (snap.empty) {
        auditDiv.innerHTML = '<p class="loading-text">No hay acciones registradas aún.</p>';
        return;
      }

      snap.forEach(doc => {
        const data = doc.data();
        const date = data.fecha ? new Date(data.fecha.seconds * 1000).toLocaleString() : "...";
        
        const item = document.createElement("div");
        item.className = "audit-item";
        item.innerHTML = `
          <div class="audit-item-time">${date}</div>
          <div class="audit-item-desc">
            <span class="audit-item-user">${data.usuario_nombre}</span>
            <span class="audit-item-badge ${data.usuario_rol}">${data.usuario_rol}</span>
            — <strong>${data.accion}</strong>: ${data.detalles}
          </div>
        `;
        auditDiv.appendChild(item);
      });
    });
  }
}

// Actualizar contadores del panel de inicio
function renderStats() {
  const statReservasMes = document.getElementById("statReservasMes");
  const statClientes = document.getElementById("statClientes");

  if (statReservasMes) {
    const curYear = new Date().getFullYear();
    const curMonth = new Date().getMonth();
    const countThisMonth = reservations.filter(res => {
      if (!res.fecha) return false;
      const parts = res.fecha.split("-");
      return parseInt(parts[0]) === curYear && (parseInt(parts[1]) - 1) === curMonth;
    }).length;
    statReservasMes.innerText = countThisMonth;
  }

  if (statClientes) {
    statClientes.innerText = clients.length;
  }
}

// ============================================================
// 5. LÓGICA DEL CALENDARIO (GRID DINÁMICO)
// ============================================================

function setupCalendarEvents() {
  document.getElementById("prevMonthBtn").addEventListener("click", () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar();
  });

  document.getElementById("nextMonthBtn").addEventListener("click", () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar();
  });

  // Modal de reserva y día
  document.getElementById("closeDayModalBtn").addEventListener("click", () => {
    document.getElementById("dayModal").style.display = "none";
  });

  document.getElementById("closeEventFormModalBtn").addEventListener("click", () => {
    document.getElementById("eventFormModal").style.display = "none";
  });

  // Botón Agregar Reserva
  document.getElementById("addEventBtn").addEventListener("click", () => {
    if (currentUserProfile.rol !== "admin") return;
    openReservationModal();
  });

  // Guardar Reserva
  document.getElementById("reservationForm").addEventListener("submit", saveReservation);

  // Eliminar Reserva
  document.getElementById("deleteReservaBtn").addEventListener("click", deleteReservation);
}

function renderCalendar() {
  const grid = document.getElementById("calendarDaysGrid");
  grid.innerHTML = "";

  document.getElementById("calendarMonthYear").innerText = `${MONTHS_SPANISH[currentMonth]} ${currentYear}`;

  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // Domingo: 0, Lunes: 1...
  // Ajustar domingo para que sea el día 7 de la semana (1: Lun, 2: Mar... 7: Dom)
  const adjustedFirstDay = firstDayIndex === 0 ? 7 : firstDayIndex;

  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevMonthTotalDays = new Date(currentYear, currentMonth, 0).getDate();

  // Días del mes anterior (inacivos)
  for (let i = adjustedFirstDay - 1; i > 0; i--) {
    const cell = document.createElement("div");
    cell.className = "calendar-day-cell inactive";
    cell.innerHTML = `<span class="day-num">${prevMonthTotalDays - i + 1}</span>`;
    grid.appendChild(cell);
  }

  // Días del mes actual
  const today = new Date();
  for (let day = 1; day <= totalDays; day++) {
    const cell = document.createElement("div");
    cell.className = "calendar-day-cell";
    
    if (day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
      cell.classList.add("today");
    }

    cell.innerHTML = `<span class="day-num">${day}</span><div class="day-events-wrap" id="day-events-${day}"></div>`;

    // Buscar reservas en esta fecha
    const mStr = String(currentMonth + 1).padStart(2, "0");
    const dStr = String(day).padStart(2, "0");
    const dateKey = `${currentYear}-${mStr}-${dStr}`;

    // Filtrar reservas que caen en este día
    const dayRes = reservations.filter(res => res.fecha === dateKey);

    // Llenar celdas con eventos
    setTimeout(() => {
      const wrap = document.getElementById(`day-events-${day}`);
      if (wrap) {
        dayRes.forEach(res => {
          // Si el usuario es gestor, ocultar detalles de eventos que no sean suyos
          const isOwner = currentUserProfile.rol === "admin" || res.gestor_assigned === currentUserProfile.uid || res.gestor_asignado === currentUserProfile.uid;
          
          const pill = document.createElement("div");
          pill.className = `cal-event-pill ${getExpClass(res.experiencia)}`;
          pill.innerText = isOwner ? `${res.hora} - ${res.cliente_nombre}` : `${res.hora} - Reserva`;
          pill.title = isOwner ? `${res.experiencia} con ${res.cliente_nombre} (${res.hora})` : "Reserva Reservada";
          
          pill.addEventListener("click", (e) => {
            e.stopPropagation(); // Evitar abrir modal de día completo
            if (isOwner) {
              openReservationModal(res);
            } else {
              alert("Esta reserva está asignada a otro gestor. No puedes acceder a sus detalles.");
            }
          });
          wrap.appendChild(pill);
        });
      }
    }, 0);

    // Evento al hacer clic en el día
    cell.addEventListener("click", () => {
      openDayModal(day, dateKey, dayRes);
    });

    grid.appendChild(cell);
  }

  // Rellenar con días del mes siguiente para completar la cuadrícula (mínimo 42 celdas en total)
  const totalClippedCells = adjustedFirstDay - 1 + totalDays;
  const nextMonthCellsNeeded = 42 - totalClippedCells;
  for (let i = 1; i <= nextMonthCellsNeeded; i++) {
    const cell = document.createElement("div");
    cell.className = "calendar-day-cell inactive";
    cell.innerHTML = `<span class="day-num">${i}</span>`;
    grid.appendChild(cell);
  }
}

function getExpClass(exp) {
  if (exp.includes("Enigma")) return "enigma";
  if (exp.includes("Campamento")) return "campamento";
  return "personalizada";
}

// Modal de detalles de un día
function openDayModal(dayNum, dateStr, dayRes) {
  const modal = document.getElementById("dayModal");
  document.getElementById("dayModalTitle").innerText = `Eventos del ${dayNum} de ${MONTHS_SPANISH[currentMonth]} ${currentYear}`;
  
  const list = document.getElementById("dayEventsList");
  list.innerHTML = "";

  if (dayRes.length === 0) {
    list.innerHTML = `
      <p class="text-muted" style="text-align: center; padding: 1.5rem 0;">No hay experiencias programadas para hoy.</p>
      ${currentUserProfile.rol === "admin" ? `<button class="btn-primary-glow" id="btnQuickAdd" style="margin-top: 10px;">+ Añadir Reserva</button>` : ""}
    `;
    if (currentUserProfile.rol === "admin") {
      document.getElementById("btnQuickAdd").addEventListener("click", () => {
        modal.style.display = "none";
        openReservationModal(null, dateStr);
      });
    }
  } else {
    dayRes.forEach(res => {
      const isOwner = currentUserProfile.rol === "admin" || res.gestor_asignado === currentUserProfile.uid;
      
      const card = document.createElement("div");
      card.className = `day-event-card ${getExpClass(res.experiencia)}`;
      
      const gestorNombre = gestores.find(g => g.uid === res.gestor_asignado)?.nombre || "Sin Asignar";

      card.innerHTML = `
        <div class="day-event-card-left">
          <h4>${isOwner ? res.cliente_nombre : "Reserva"} (${res.hora})</h4>
          <p>${res.experiencia} — 👤 Gestor: ${gestorNombre}</p>
        </div>
        <span class="status-tag ${res.estado}">${res.estado}</span>
      `;
      
      card.addEventListener("click", () => {
        if (isOwner) {
          modal.style.display = "none";
          openReservationModal(res);
        } else {
          alert("Acceso denegado: Reservado para otro gestor.");
        }
      });
      list.appendChild(card);
    });

    if (currentUserProfile.rol === "admin") {
      const addBtn = document.createElement("button");
      addBtn.className = "btn-secondary";
      addBtn.innerText = "+ Añadir otra reserva hoy";
      addBtn.style.width = "100%";
      addBtn.style.marginTop = "1rem";
      addBtn.addEventListener("click", () => {
        modal.style.display = "none";
        openReservationModal(null, dateStr);
      });
      list.appendChild(addBtn);
    }
  }

  modal.style.display = "flex";
}

// Modal de Crear / Editar Reserva
function openReservationModal(res = null, defaultDate = "") {
  const modal = document.getElementById("eventFormModal");
  const form = document.getElementById("reservationForm");
  form.reset();

  const title = document.getElementById("eventFormModalTitle");
  const deleteBtn = document.getElementById("deleteReservaBtn");
  const resStatusGroup = document.getElementById("resStatusGroup");
  const gestorCloseNotesGroup = document.getElementById("gestorCloseNotesGroup");

  const inputs = form.querySelectorAll("input, select, textarea");

  if (res) {
    // Editar
    title.innerText = "Editar Reserva / Detalles";
    document.getElementById("reservaId").value = res.id;
    document.getElementById("resName").value = res.cliente_nombre;
    document.getElementById("resEmail").value = res.cliente_email;
    document.getElementById("resPhone").value = res.cliente_telefono || "";
    document.getElementById("resExp").value = res.experiencia;
    document.getElementById("resDate").value = res.fecha;
    document.getElementById("resTime").value = res.hora;
    document.getElementById("resGestor").value = res.gestor_asignado || "";
    document.getElementById("resNotes").value = res.notas_internas || "";
    document.getElementById("resStatus").value = res.estado || "pendiente";
    document.getElementById("resNotesSesion").value = res.notas_sesion || "";

    resStatusGroup.style.display = "block";

    if (currentUserProfile.rol === "admin") {
      deleteBtn.style.display = "inline-block";
      inputs.forEach(el => {
        if (el.id !== "resNotesSesion") el.disabled = false;
      });
      gestorCloseNotesGroup.style.display = "block"; // El admin puede ver/editar
    } else {
      // Es gestor
      deleteBtn.style.display = "none";
      // El gestor no puede editar datos de cliente, fecha, hora, etc.
      inputs.forEach(el => {
        if (el.id !== "resStatus" && el.id !== "resNotesSesion" && el.id !== "saveReservaBtn") {
          el.disabled = true;
        }
      });
      gestorCloseNotesGroup.style.display = "block";
    }
  } else {
    // Crear (Admin Only)
    title.innerText = "Nueva Reserva de Experiencia";
    document.getElementById("reservaId").value = "";
    document.getElementById("resDate").value = defaultDate;
    deleteBtn.style.display = "none";
    resStatusGroup.style.display = "none";
    gestorCloseNotesGroup.style.display = "none";

    inputs.forEach(el => el.disabled = false);
  }

  modal.style.display = "flex";
}

// Guardar / Actualizar Reserva
async function saveReservation(e) {
  e.preventDefault();
  const id = document.getElementById("reservaId").value;
  const cliente_nombre = document.getElementById("resName").value.trim();
  const cliente_email = document.getElementById("resEmail").value.trim().toLowerCase();
  const cliente_telefono = document.getElementById("resPhone").value.trim();
  const experiencia = document.getElementById("resExp").value;
  const fecha = document.getElementById("resDate").value;
  const hora = document.getElementById("resTime").value;
  const gestor_asignado = document.getElementById("resGestor").value;
  const notas_internas = document.getElementById("resNotes").value.trim();
  const estado = id ? document.getElementById("resStatus").value : "pendiente";
  const notas_sesion = id ? document.getElementById("resNotesSesion").value.trim() : "";

  // Validación de gestor para rellenar
  if (estado === "completada" && !notas_sesion) {
    alert("Debes escribir la nota post-juego (Reporte) para poder completar la reserva.");
    return;
  }

  try {
    const payload = {
      cliente_nombre,
      cliente_email,
      cliente_telefono,
      experiencia,
      fecha,
      hora,
      gestor_asignado,
      notas_internas,
      estado,
      notas_sesion
    };

    if (id) {
      // Actualizar
      await updateDoc(doc(db, "reservas", id), payload);

      // Si se completó, añadir experiencia jugada a la ficha del cliente
      if (estado === "completada") {
        const clienteRef = doc(db, "clientes", cliente_email);
        const snapC = await getDoc(clienteRef);
        if (snapC.exists()) {
          const list = snapC.data().experiences_jugadas || [];
          if (!list.includes(experiencia)) {
            list.push(experiencia);
            await updateDoc(clienteRef, { experiencias_jugadas: list });
          }
        } else {
          await setDoc(clienteRef, {
            nombre: cliente_nombre,
            telefono: cliente_telefono,
            recibir_promociones: false,
            experiancias_jugadas: [experiencia],
            consultas: []
          });
        }
      }

      await logAction(
        currentUserProfile.nombre,
        currentUserProfile.rol,
        "Modificó Reserva",
        `Editó reserva ID ${id} para ${cliente_nombre} (${experiencia}) - Estado: ${estado}`
      );
    } else {
      // Crear
      const newDocRef = await addDoc(collection(db, "reservas"), payload);

      // Añadir la experiencia al cliente
      const clienteRef = doc(db, "clientes", cliente_email);
      const snapC = await getDoc(clienteRef);
      if (snapC.exists()) {
        const list = snapC.data().experiencias_jugadas || [];
        if (!list.includes(experiencia)) {
          list.push(experiencia);
          await updateDoc(clienteRef, { experiencias_jugadas: list });
        }
      } else {
        await setDoc(clienteRef, {
          nombre: cliente_nombre,
          telefono: cliente_telefono,
          recibir_promociones: false,
          experiencias_jugadas: [experiencia],
          consultas: []
        });
      }

      await logAction(
        currentUserProfile.nombre,
        currentUserProfile.rol,
        "Creó Reserva",
        `Registró nueva reserva (${experiencia}) para ${cliente_nombre} el ${fecha} a las ${hora}`
      );
    }

    document.getElementById("eventFormModal").style.display = "none";
  } catch (err) {
    console.error("Error al guardar reserva:", err);
    alert("Error al guardar: " + err.message);
  }
}

// Eliminar Reserva
async function deleteReservation() {
  const id = document.getElementById("reservaId").value;
  const cliente_nombre = document.getElementById("resName").value;
  const experiencia = document.getElementById("resExp").value;
  
  if (!id) return;

  if (confirm(`¿Estás seguro de que quieres borrar la reserva de ${cliente_nombre} (${experiencia})?`)) {
    try {
      await deleteDoc(doc(db, "reservas", id));
      await logAction(
        currentUserProfile.nombre,
        currentUserProfile.rol,
        "Eliminó Reserva",
        `Borró la reserva ID ${id} del cliente ${cliente_nombre}`
      );
      document.getElementById("eventFormModal").style.display = "none";
    } catch (err) {
      console.error("Error al borrar reserva:", err);
      alert("Error al eliminar: " + err.message);
    }
  }
}

// Renderizar tabla de siguientes eventos (Inicio)
function renderNextEvents() {
  const tbody = document.getElementById("dashboardNextEvents");
  tbody.innerHTML = "";

  // Filtrar próximas y ordenar por fecha/hora
  const todayStr = new Date().toISOString().split("T")[0];
  const list = reservations.filter(res => {
    // El gestor solo ve sus asignaciones
    if (currentUserProfile.rol !== "admin" && res.gestor_asignado !== currentUserProfile.uid) {
      return false;
    }
    return res.fecha >= todayStr;
  });

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="loading-cell">No hay experiencias programadas próximamente.</td></tr>`;
    return;
  }

  list.forEach(res => {
    const gestName = gestores.find(g => g.uid === res.gestor_asignado)?.nombre || "No Asignado";
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td><strong>${res.fecha}</strong></td>
      <td>${res.hora}</td>
      <td><span class="dot ${getExpClass(res.experiencia)}"></span> ${res.experiencia}</td>
      <td>${res.cliente_nombre}</td>
      <td>${gestName}</td>
      <td><span class="status-tag ${res.estado}">${res.estado}</span></td>
      <td><button class="btn-secondary" id="btn-view-${res.id}">Ver Ficha</button></td>
    `;
    tbody.appendChild(tr);

    document.getElementById(`btn-view-${res.id}`).addEventListener("click", () => {
      openReservationModal(res);
    });
  });
}

// ============================================================
// 6. BUZÓN DE CORREOS / SOLICITUDES
// ============================================================

function setupMailboxEvents() {
  document.querySelectorAll(".mailbox-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".mailbox-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentTab = tab.getAttribute("data-target") || tab.getAttribute("data-status");
      // Volver a cargar la bandeja de entrada
      const mailboxItemsList = document.getElementById("mailboxItemsList");
      mailboxItemsList.innerHTML = '<p class="loading-text">Filtrando mensajes...</p>';
    });
  });
}

function renderMailbox(requests) {
  const list = document.getElementById("mailboxItemsList");
  if (!list) return;
  list.innerHTML = "";

  const filtered = requests.filter(req => req.estado === currentTab);

  if (filtered.length === 0) {
    list.innerHTML = `<p class="loading-text">No hay solicitudes en esta carpeta.</p>`;
    return;
  }

  filtered.forEach(req => {
    const div = document.createElement("div");
    div.className = "mail-item";
    const date = req.fecha_solicitud ? new Date(req.fecha_solicitud.seconds * 1000).toLocaleDateString() : "...";

    div.innerHTML = `
      <div class="mail-item-header">
        <h4>${req.nombre}</h4>
        <span class="mail-item-date">${date}</span>
      </div>
      <div class="mail-item-type">${req.tipo_evento}</div>
      <div class="mail-item-msg">${req.mensaje}</div>
    `;

    div.addEventListener("click", () => {
      document.querySelectorAll(".mail-item").forEach(item => item.classList.remove("selected"));
      div.classList.add("selected");
      openMailDetail(req);
    });

    list.appendChild(div);
  });
}

function renderPendingRequests(pending) {
  const pPanel = document.getElementById("dashboardPendingRequests");
  if (!pPanel) return;
  pPanel.innerHTML = "";

  if (pending.length === 0) {
    pPanel.innerHTML = '<p class="text-muted" style="text-align: center; padding: 1rem 0;">¡Al día! No hay correos pendientes por contestar.</p>';
    return;
  }

  pending.slice(0, 5).forEach(req => {
    const date = req.fecha_solicitud ? new Date(req.fecha_solicitud.seconds * 1000).toLocaleDateString() : "...";
    const div = document.createElement("div");
    div.style.padding = "0.8rem";
    div.style.borderBottom = "1px solid var(--border-color)";
    div.style.cursor = "pointer";
    div.innerHTML = `
      <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600;">
        <span>${req.nombre}</span>
        <span style="color: var(--color-magenta);">${req.tipo_evento}</span>
      </div>
      <p style="font-size: 0.8rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 3px;">${req.mensaje}</p>
    `;
    div.addEventListener("click", () => {
      switchView("view-buzon");
      // Activar tab Nuevos
      document.querySelectorAll(".mailbox-tab").forEach(t => t.classList.remove("active"));
      document.querySelector('[data-status="nuevo"]').classList.add("active");
      currentTab = "nuevo";
      // Seleccionar el item
      setTimeout(() => {
        openMailDetail(req);
      }, 100);
    });
    pPanel.appendChild(div);
  });
}

function openMailDetail(req) {
  document.getElementById("noSelectionState")?.remove();
  const detailPanel = document.getElementById("mailboxDetailPanel");
  const contentDiv = document.getElementById("mailDetailContent");
  contentDiv.style.display = "block";

  const date = req.fecha_solicitud ? new Date(req.fecha_solicitud.seconds * 1000).toLocaleString() : "...";

  contentDiv.innerHTML = `
    <div class="mail-detail-header">
      <div class="mail-detail-title">
        <h3>Solicitud de: ${req.nombre}</h3>
        <div class="mail-meta-info">
          <span>📧 Email: <a href="mailto:${req.email}">${req.email}</a></span><br>
          <span>📞 Teléfono: ${req.telefono || "No facilitado"}</span><br>
          <span>📅 Fecha recibida: ${date}</span><br>
          <span>🏷️ Tipo de evento: <strong>${req.tipo_evento}</strong></span>
        </div>
      </div>
      <div class="mail-detail-actions">
        ${req.estado === 'nuevo' ? `<button class="btn-primary-glow" id="btnReplyMail">✉ Responder</button>` : ''}
        ${req.estado === 'nuevo' ? `<button class="btn-secondary" id="btnMarkReplied">Marcar Respondido</button>` : ''}
        ${req.estado !== 'archivado' ? `<button class="btn-danger" id="btnArchiveMail">Archivar</button>` : ''}
        ${req.estado === 'archivado' ? `<button class="btn-secondary" id="btnRestoreMail">Restaurar a Nuevo</button>` : ''}
      </div>
    </div>
    
    <div class="mail-body-box">
      <p style="font-weight: 600; font-size: 0.75rem; text-transform: uppercase; color: var(--color-magenta); margin-bottom: 8px;">Detalles enviados por el usuario:</p>
      ${req.mensaje}
    </div>

    <div class="mail-conversion-box">
      <div>
        <h4>¿Se ha contratado esta experiencia?</h4>
        <p>Convierte esta solicitud en un evento de calendario asignando un gestor del equipo.</p>
      </div>
      <button class="btn-add-event" id="btnConvertToBooking">📅 Crear Reserva</button>
    </div>
  `;

  // Listeners de acciones del Buzón
  if (document.getElementById("btnReplyMail")) {
    document.getElementById("btnReplyMail").addEventListener("click", () => {
      const subject = encodeURIComponent("Contacto Vivamos Jugando — Propuesta de Experiencia");
      const body = encodeURIComponent(`Hola ${req.nombre},\n\nGracias por ponerte en contacto con nosotros para tu evento de ${req.tipo_evento}.\n\nHemos leído tu propuesta: "${req.mensaje}" y nos parece genial.\n\nQueríamos consultarte...`);
      window.location.href = `mailto:${req.email}?subject=${subject}&body=${body}`;
    });
  }

  if (document.getElementById("btnMarkReplied")) {
    document.getElementById("btnMarkReplied").addEventListener("click", async () => {
      await updateDoc(doc(db, "solicitudes_contacto", req.id), { estado: "respondido" });
      await logAction(currentUserProfile.nombre, currentUserProfile.rol, "Modificó Correo", `Marcó como respondido el mensaje de ${req.nombre}`);
      contentDiv.style.display = "none";
      detailPanel.innerHTML = `
        <div class="no-selection-state">
          <span>📬</span>
          <p>Solicitud marcada como respondida.</p>
        </div>
      `;
    });
  }

  if (document.getElementById("btnArchiveMail")) {
    document.getElementById("btnArchiveMail").addEventListener("click", async () => {
      await updateDoc(doc(db, "solicitudes_contacto", req.id), { estado: "archivado" });
      await logAction(currentUserProfile.nombre, currentUserProfile.rol, "Archivó Correo", `Archivó el mensaje de ${req.nombre}`);
      contentDiv.style.display = "none";
      detailPanel.innerHTML = `
        <div class="no-selection-state">
          <span>📬</span>
          <p>Solicitud archivada.</p>
        </div>
      `;
    });
  }

  if (document.getElementById("btnRestoreMail")) {
    document.getElementById("btnRestoreMail").addEventListener("click", async () => {
      await updateDoc(doc(db, "solicitudes_contacto", req.id), { estado: "nuevo" });
      await logAction(currentUserProfile.nombre, currentUserProfile.rol, "Restauró Correo", `Restauró el mensaje de ${req.nombre} a la carpeta principal`);
      contentDiv.style.display = "none";
      detailPanel.innerHTML = `
        <div class="no-selection-state">
          <span>📬</span>
          <p>Solicitud restaurada a la bandeja de entrada.</p>
        </div>
      `;
    });
  }

  // Convertir a Reserva
  document.getElementById("btnConvertToBooking").addEventListener("click", () => {
    // Pre-rellenar modal de reserva
    openReservationModal({
      cliente_nombre: req.nombre,
      cliente_email: req.email,
      cliente_telefono: req.telefono || "",
      experiencia: req.tipo_evento.includes("Despedida") ? "A Medida - Despedida" : req.tipo_evento.includes("Cumpleanos") ? "A Medida - Cumpleanos" : "A Medida",
      fecha: new Date().toISOString().split("T")[0],
      hora: "17:00",
      gestor_asignado: "",
      notas_internas: `Creado desde solicitud de contacto. Detalles originales:\n"${req.mensaje}"`,
      estado: "pendiente"
    });
  });
}

// ============================================================
// 7. BASE DE DATOS DE CLIENTES & MARKETING
// ============================================================

function setupClientEvents() {
  const searchInput = document.getElementById("clientSearch");
  const filterSelect = document.getElementById("clientFilterPromo");

  searchInput.addEventListener("input", renderClients);
  filterSelect.addEventListener("change", renderClients);

  // Copiar lista de emails aceptan promo
  document.getElementById("copyEmailsBtn").addEventListener("click", () => {
    const list = clients.filter(c => c.recibir_promociones);
    if (list.length === 0) {
      alert("No hay clientes que acepten recibir promociones en este momento.");
      return;
    }
    const emails = list.map(c => c.email).join(", ");
    navigator.clipboard.writeText(emails).then(() => {
      alert(`¡Copiado al portapapeles! ${list.length} correos electrónicos listos para tu campaña.`);
    }).catch(err => {
      console.error("Error copiando emails:", err);
      alert("Error al copiar correos: " + err.message);
    });
  });

  // Modal de Editar Cliente
  const editModal = document.getElementById("editClientModal");
  const closeEditBtn = document.getElementById("closeEditClientModalBtn");
  const cancelEditBtn = document.getElementById("cancelEditClientBtn");
  const editForm = document.getElementById("editClientForm");

  if (closeEditBtn && editModal) {
    closeEditBtn.addEventListener("click", () => editModal.style.display = "none");
  }
  if (cancelEditBtn && editModal) {
    cancelEditBtn.addEventListener("click", () => editModal.style.display = "none");
  }

  // Cerrar haciendo clic fuera
  window.addEventListener("click", (e) => {
    if (e.target === editModal) {
      editModal.style.display = "none";
    }
  });

  if (editForm) {
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("editClientEmail").value;
      const nombre = document.getElementById("editClientName").value.trim();
      const telefono = document.getElementById("editClientPhone").value.trim();
      const recibirPromo = document.getElementById("editClientPromo").value === "si";
      const notas = document.getElementById("editClientNotes").value.trim();

      try {
        await updateDoc(doc(db, "clientes", email), {
          nombre: nombre,
          telefono: telefono,
          recibir_promociones: recibirPromo,
          notas_marketing: notas
        });

        await logAction(
          currentUserProfile.nombre,
          currentUserProfile.rol,
          "Editar Cliente",
          `Modificó datos del cliente: ${email}`
        );

        editModal.style.display = "none";
        alert("Cliente actualizado correctamente.");
      } catch (err) {
        console.error("Error al actualizar cliente:", err);
        alert("Error al actualizar cliente: " + err.message);
      }
    });
  }

  // Definir funciones en window para que puedan llamarse desde onclick inline
  window.editarCliente = function(email) {
    const client = clients.find(c => c.email === email);
    if (!client) return;

    document.getElementById("editClientName").value = client.nombre || "";
    document.getElementById("editClientEmail").value = client.email || "";
    document.getElementById("editClientPhone").value = client.telefono || "";
    document.getElementById("editClientPromo").value = client.recibir_promociones ? "si" : "no";
    document.getElementById("editClientNotes").value = client.notas_marketing || "";

    editModal.style.display = "flex";
  };

  window.eliminarCliente = async function(email, nombre) {
    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente al cliente ${nombre} (${email}) de la base de datos? Esta acción no se puede deshacer.`)) {
      try {
        await deleteDoc(doc(db, "clientes", email));

        await logAction(
          currentUserProfile.nombre,
          currentUserProfile.rol,
          "Eliminar Cliente",
          `Eliminó al cliente: ${nombre} (${email})`
        );

        alert("Cliente eliminado con éxito.");
      } catch (err) {
        console.error("Error al eliminar cliente:", err);
        alert("Error al eliminar cliente: " + err.message);
      }
    }
  };
}

function renderClients() {
  const tbody = document.getElementById("clientsTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const search = document.getElementById("clientSearch").value.toLowerCase();
  const filterPromo = document.getElementById("clientFilterPromo").value;

  const filtered = clients.filter(c => {
    const matchesSearch = c.nombre.toLowerCase().includes(search) || 
                          c.email.toLowerCase().includes(search) || 
                          (c.telefono && c.telefono.includes(search));
    
    let matchesPromo = true;
    if (filterPromo === "promo") matchesPromo = c.recibir_promociones === true;
    if (filterPromo === "nopromo") matchesPromo = c.recibir_promociones !== true;

    return matchesSearch && matchesPromo;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="loading-cell">No se encontraron clientes que coincidan con la búsqueda.</td></tr>`;
    return;
  }

  filtered.forEach(c => {
    const qCount = c.consultas ? c.consultas.length : 0;
    const gCount = c.experiencias_jugadas ? c.experiencias_jugadas.length : 0;
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td><strong>${c.nombre}</strong></td>
      <td><a href="mailto:${c.email}">${c.email}</a></td>
      <td>${c.telefono || "—"}</td>
      <td><span class="status-tag ${c.recibir_promociones ? 'respondido' : 'archivado'}">${c.recibir_promociones ? 'SÍ' : 'NO'}</span></td>
      <td>${qCount} consultas</td>
      <td><span style="font-weight: 700; color: var(--color-green);">${gCount} experiencias</span></td>
      <td>
        <input type="text" id="note-${c.email.replace(/[@.]/g, '_')}" value="${c.notas_marketing || ''}" placeholder="Añadir nota de campaña..." style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); color: #FFF; padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; width: 100%;">
      </td>
      <td>
        <div style="display: flex; gap: 6px; justify-content: center; align-items: center;">
          <button class="btn-secondary" id="save-note-${c.email.replace(/[@.]/g, '_')}" title="Guardar Nota">💾</button>
          <button class="btn-secondary" onclick="window.editarCliente('${c.email}')" title="Editar Cliente">✏️</button>
          <button class="btn-danger" style="border-color: rgba(239,68,68,0.3); padding: 0.4rem 0.6rem;" onclick="window.eliminarCliente('${c.email}', '${c.nombre}')" title="Eliminar Cliente">🗑️</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);

    // Listener para guardar notas individuales de marketing
    document.getElementById(`save-note-${c.email.replace(/[@.]/g, '_')}`).addEventListener("click", async () => {
      const inputVal = document.getElementById(`note-${c.email.replace(/[@.]/g, '_')}`).value.trim();
      try {
        await updateDoc(doc(db, "clientes", c.email), { notas_marketing: inputVal });
        await logAction(currentUserProfile.nombre, currentUserProfile.rol, "Guardó Nota Marketing", `Actualizó la nota del cliente: ${c.email}`);
        alert("Nota de cliente guardada correctamente.");
      } catch (err) {
        console.error("Error guardando nota de cliente:", err);
      }
    });
  });
}

// ============================================================
// 8. EQUIPO (REGISTRO Y GESTORES)
// ============================================================

function renderGestores() {
  const cardsWrap = document.getElementById("gestoresCardsList");
  if (!cardsWrap) return;
  cardsWrap.innerHTML = "";

  if (gestores.length === 0) {
    cardsWrap.innerHTML = '<p class="loading-text">No hay miembros registrados.</p>';
    return;
  }

  gestores.forEach(g => {
    const card = document.createElement("div");
    card.className = `gestor-card ${g.rol}`;
    
    card.innerHTML = `
      <div class="gestor-avatar-circle">${g.rol === 'admin' ? '👑' : '🛡️'}</div>
      <h4>${g.nombre}</h4>
      <span class="gestor-card-role">${g.rol}</span>
      <div class="gestor-card-contact">✉ ${g.email}</div>
      <div class="gestor-card-contact">📞 ${g.telefono || 'Sin teléfono'}</div>
    `;

    cardsWrap.appendChild(card);
  });
}

function setupGestoresForm() {
  const form = document.getElementById("addGestorForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nombre = document.getElementById("gestorNombre").value.trim();
    const email = document.getElementById("gestorEmail").value.trim();
    const telefono = document.getElementById("gestorTelefono").value.trim();
    const pass = document.getElementById("gestorPassword").value;
    const rol = document.getElementById("gestorRole").value;

    const msgDiv = document.getElementById("addGestorMsg");
    msgDiv.style.display = "none";

    try {
      console.log(`Dando de alta usuario en Auth temporal...`);

      // Creación del nuevo gestor usando una instancia local de Firebase App secundaria.
      // Esto previene que se desloguee el administrador actual de la sesión.
      const secondaryApp = initializeApp(firebaseConfig, "SecondaryAppInstance");
      const secondaryAuth = getAuth(secondaryApp);

      const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, pass);
      const newUid = userCred.user.uid;

      // Crear su perfil en Firestore
      await setDoc(doc(db, "usuarios_dashboard", newUid), {
        nombre,
        email,
        telefono,
        rol,
        fecha_creacion: serverTimestamp()
      });

      // Desconectar el auth secundario inmediatamente para no interferir
      await signOut(secondaryAuth);

      await logAction(
        currentUserProfile.nombre,
        currentUserProfile.rol,
        "Alta de Personal",
        `Registró al nuevo ${rol}: ${nombre} (${email})`
      );

      form.reset();
      msgDiv.innerText = `¡Usuario ${nombre} dado de alta con éxito en la plataforma!`;
      msgDiv.className = "success-msg";
      msgDiv.style.display = "block";
    } catch (err) {
      console.error("Error al registrar gestor:", err);
      msgDiv.innerText = "Error al crear usuario: " + err.message;
      msgDiv.className = "auth-error-msg";
      msgDiv.style.display = "block";
    }
  });
}

/* ============================================================
   INTEGRACIÓN DE OPERACIÓN ENIGMA
   ============================================================ */

function setupEnigmaEvents() {
  const btnManage = document.getElementById("btn-manage-enigma");
  const btnBack = document.getElementById("btn-back-to-selector");
  const selector = document.getElementById("enigma-selector-screen");
  const consoleScreen = document.getElementById("enigma-console-screen");

  if (btnManage && btnBack && selector && consoleScreen) {
    btnManage.addEventListener("click", () => {
      selector.style.display = "none";
      consoleScreen.style.display = "block";
      startEnigmaListeners();
    });

    btnBack.addEventListener("click", () => {
      consoleScreen.style.display = "none";
      selector.style.display = "grid";
      stopEnigmaListeners();
    });
  }

  // 1. Envío de Chat de HQ
  const btnSendChat = document.getElementById("enigma-btn-send-chat");
  const chatInput = document.getElementById("enigma-chat-input");
  if (btnSendChat && chatInput) {
    const handleSend = () => {
      enviarMensajeEnigma();
    };

    btnSendChat.addEventListener("click", handleSend);
    chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleSend();
    });
  }

  // 2. Añadir Agente Manual
  const btnAddAgent = document.getElementById("enigma-btn-add-agent");
  if (btnAddAgent) {
    btnAddAgent.addEventListener("click", async () => {
      const inputNombre = document.getElementById("enigma-new-agent-name");
      const inputCodigo = document.getElementById("enigma-new-agent-code");
      const nombre = inputNombre.value.trim().toUpperCase();
      const codigo = inputCodigo.value.trim().toUpperCase();

      if (!nombre || !codigo) {
        alert("Por favor, introduce el nombre del agente y su código de acceso.");
        return;
      }

      try {
        const agentsRef = collection(db, "grupos", ENIGMA_GROUP_ID, "integrantes");
        await addDoc(agentsRef, {
          nombre: nombre,
          codigo_individual: codigo,
          validado: false,
          llegado: false
        });

        await logAction(
          currentUserProfile.nombre,
          currentUserProfile.rol,
          "Enigma - Nuevo Agente",
          `Añadió manualmente al agente ${nombre} con código ${codigo}`
        );

        inputNombre.value = "";
        inputCodigo.value = "";
      } catch (err) {
        console.error("Error al añadir agente Enigma:", err);
        alert("Error al añadir agente: " + err.message);
      }
    });
  }

  // 3. Guardar Configuración de Cita
  const btnSaveCita = document.getElementById("enigma-btn-save-cita");
  if (btnSaveCita) {
    btnSaveCita.addEventListener("click", async () => {
      const dia = document.getElementById("enigma-cfg-cita-dia").value.trim().toUpperCase();
      const hora = document.getElementById("enigma-cfg-cita-hora").value.trim().toUpperCase();

      try {
        const groupRef = doc(db, "grupos", ENIGMA_GROUP_ID);
        await updateDoc(groupRef, {
          cita_dia: dia,
          cita_hora: hora
        });

        await logAction(
          currentUserProfile.nombre,
          currentUserProfile.rol,
          "Enigma - Config Cita",
          `Actualizó cita de Operación Enigma a: ${dia} a las ${hora}`
        );

        alert("Cita de Operación Enigma actualizada correctamente.");
      } catch (err) {
        console.error("Error al actualizar cita Enigma:", err);
        alert("Error al actualizar la cita.");
      }
    });
  }

  // 4. Pausar/Reanudar Operación
  const btnTogglePause = document.getElementById("enigma-btn-toggle-pause");
  if (btnTogglePause) {
    btnTogglePause.addEventListener("click", async () => {
      try {
        const groupRef = doc(db, "grupos", ENIGMA_GROUP_ID);
        const docSnap = await getDoc(groupRef);
        if (!docSnap.exists()) return;

        const data = docSnap.data();
        const isPausado = data.pausado || false;

        if (!isPausado) {
          // Pausar
          await updateDoc(groupRef, {
            pausado: true,
            pausa_inicio: serverTimestamp()
          });
          await logAction(
            currentUserProfile.nombre,
            currentUserProfile.rol,
            "Enigma - Pausa",
            `Pausó la Operación Enigma`
          );
        } else {
          // Reanudar
          let updates = {
            pausado: false,
            pausa_inicio: null
          };

          if (data.tiempo_inicio) {
            const now = Date.now();
            const pausaInicio = (data.pausa_inicio ? data.pausa_inicio.toDate().getTime() : now);
            const duracionPausa = now - pausaInicio;
            const nuevoInicio = new Date(data.tiempo_inicio.toDate().getTime() + duracionPausa);
            updates.tiempo_inicio = nuevoInicio;
          }

          await updateDoc(groupRef, updates);
          await logAction(
            currentUserProfile.nombre,
            currentUserProfile.rol,
            "Enigma - Reanudar",
            `Reanudó la Operación Enigma`
          );
        }
      } catch (err) {
        console.error("Error al cambiar estado de pausa Enigma:", err);
      }
    });
  }

  // 5. Limpiar Chat
  const btnResetMessages = document.getElementById("enigma-btn-reset-messages");
  if (btnResetMessages) {
    btnResetMessages.addEventListener("click", async () => {
      const confirmacion = confirm("⚠️ ¿ESTÁ SEGURO?\n\nEsto borrará todo el historial de chat de la partida para todos los agentes.\nEsta acción no se puede deshacer.");
      if (!confirmacion) return;

      try {
        const messagesRef = collection(db, "grupos", ENIGMA_GROUP_ID, "mensajes");
        const snapshot = await getDocs(messagesRef);
        const deletePromises = snapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
        await Promise.all(deletePromises);

        await logAction(
          currentUserProfile.nombre,
          currentUserProfile.rol,
          "Enigma - Limpiar Chat",
          `Vació el historial del canal de emergencias de Enigma`
        );

        console.log("Chat de Enigma limpiado con éxito.");
      } catch (err) {
        console.error("Error al limpiar chat Enigma:", err);
        alert("Ocurrió un error al limpiar los mensajes.");
      }
    });
  }

  // 6. Reset de Misión Completo
  const btnFullReset = document.getElementById("enigma-btn-full-reset");
  if (btnFullReset) {
    btnFullReset.addEventListener("click", async () => {
      const confirm1 = confirm("⚠️ ¿ESTÁ SEGURO?\n\nEsta acción es irreversible y afectará a todos los jugadores en tiempo real:\n\n1. Se borrará el chat.\n2. Se reiniciará el contador.\n3. Todos los agentes volverán al login.\n\n¿Desea proceder?");
      if (!confirm1) return;

      const confirm2 = confirm("☢️ CONFIRMACIÓN FINAL\n\n¿Desea purgar el sistema de Operación Enigma?");
      if (!confirm2) return;

      try {
        // 1. Borrar chat
        const messagesRef = collection(db, "grupos", ENIGMA_GROUP_ID, "mensajes");
        const msgSnap = await getDocs(messagesRef);
        const msgPromises = msgSnap.docs.map(d => deleteDoc(d.ref));
        await Promise.all(msgPromises);

        // 2. Resetear agentes
        const membersRef = collection(db, "grupos", ENIGMA_GROUP_ID, "integrantes");
        const memSnap = await getDocs(membersRef);
        const memPromises = memSnap.docs.map(d => 
          updateDoc(d.ref, { validado: false, llegado: false })
        );
        await Promise.all(memPromises);

        // 3. Resetear tiempos y estado del grupo
        const groupRef = doc(db, "grupos", ENIGMA_GROUP_ID);
        await updateDoc(groupRef, {
          tiempo_inicio: null,
          tiempo_fin: null,
          mision1_fin: null,
          mision2_fin: null,
          mision_quimera_fin: null,
          energia_reclamada: false,
          pausado: false,
          pausa_inicio: null,
          activo: true
        });

        // Log auditoría
        await logAction(
          currentUserProfile.nombre,
          currentUserProfile.rol,
          "Enigma - Reset Total",
          `Realizó un reinicio total de la Operación Enigma`
        );

        if (enigmaTimerInterval) {
          clearInterval(enigmaTimerInterval);
          enigmaTimerInterval = null;
        }

        const timerEl = document.getElementById("enigma-mission-timer");
        if (timerEl) {
          timerEl.innerText = "00:00:00";
          timerEl.style.color = "var(--color-danger)";
        }

        alert("SISTEMA DE ENIGMA PURGADO CON ÉXITO.");
      } catch (err) {
        console.error("Error al reiniciar Enigma:", err);
        alert("Error crítico al purgar el sistema.");
      }
    });
  }
}

// ------------------------------------------------------------
// LISTENERS EN TIEMPO REAL
// ------------------------------------------------------------

function startEnigmaListeners() {
  stopEnigmaListeners(); // Asegurar limpieza previa

  console.log("Iniciando escuchas en tiempo real de Operación Enigma...");

  // 1. Escuchar Estado del Grupo
  const groupRef = doc(db, "grupos", ENIGMA_GROUP_ID);
  enigmaGroupUnsub = onSnapshot(groupRef, (snapshot) => {
    if (!snapshot.exists()) return;
    const data = snapshot.data();

    // Cronómetro y Pausa
    const timerEl = document.getElementById("enigma-mission-timer");
    const statusTextEl = document.getElementById("enigma-mission-status-text");
    const startTimeEl = document.getElementById("enigma-mission-start-time");
    const btnTogglePause = document.getElementById("enigma-btn-toggle-pause");

    if (data.pausado) {
      if (statusTextEl) {
        statusTextEl.textContent = "⚠️ OPERACIÓN EN PAUSA";
        statusTextEl.style.color = "var(--color-warning)";
      }
      if (btnTogglePause) {
        btnTogglePause.innerHTML = "▶️ Reanudar Operación";
        btnTogglePause.className = "btn-success w-100 mb-2";
      }
      if (enigmaTimerInterval) clearInterval(enigmaTimerInterval);
      if (timerEl) timerEl.style.color = "var(--text-muted)";
    } else {
      if (statusTextEl) {
        statusTextEl.style.color = "var(--color-green)";
      }
      if (btnTogglePause) {
        btnTogglePause.innerHTML = "⏸️ Pausar Operación";
        btnTogglePause.className = "btn-warning w-100 mb-2";
      }

      if (data.tiempo_inicio) {
        if (statusTextEl) statusTextEl.textContent = "OPERACIÓN EN CURSO";
        iniciarContadorEnigma(data.tiempo_inicio);
      } else {
        if (statusTextEl) {
          statusTextEl.textContent = "ESPERANDO CLAVE DE ESCUADRÓN...";
          statusTextEl.style.color = "var(--color-warning)";
        }
        if (timerEl) {
          timerEl.innerText = "00:00:00";
          timerEl.style.color = "var(--color-danger)";
        }
      }
    }

    // Tiempos e hitos
    if (data.tiempo_inicio) {
      const start = data.tiempo_inicio.toDate();
      if (startTimeEl) startTimeEl.textContent = `INICIADO: ${start.toLocaleTimeString()}`;

      document.getElementById("enigma-val-mision-inicio").textContent = start.toLocaleTimeString();
      document.getElementById("enigma-val-mision-inicio").className = "milestone-val text-green";

      // Hito 1
      if (data.mision1_fin) {
        const m1 = data.mision1_fin.toDate();
        document.getElementById("enigma-val-mision-1").textContent = `COMPLETO (${m1.toLocaleTimeString()})`;
        document.getElementById("enigma-val-mision-1").className = "milestone-val text-green";
        document.getElementById("enigma-label-mision-1").className = "milestone-label text-green";

        // Hito 2
        if (data.mision2_fin) {
          const m2 = data.mision2_fin.toDate();
          document.getElementById("enigma-val-mision-2").textContent = `COMPLETO (${m2.toLocaleTimeString()})`;
          document.getElementById("enigma-val-mision-2").className = "milestone-val text-green";
          document.getElementById("enigma-label-mision-2").className = "milestone-label text-green";

          // Hito 3
          if (data.mision_quimera_fin) {
            const m3 = data.mision_quimera_fin.toDate();
            document.getElementById("enigma-val-mision-3").textContent = `HACKEO FINALIZADO (${m3.toLocaleTimeString()})`;
            document.getElementById("enigma-val-mision-3").className = "milestone-val text-magenta";
            document.getElementById("enigma-label-mision-3").className = "milestone-label text-magenta";
          } else if (data.quimera_estado) {
            document.getElementById("enigma-val-mision-3").textContent = `EN CURSO: ${data.quimera_estado}`;
            const cls = data.quimera_estado === "HACKEO EN CURSO" ? "text-danger" : "text-warning";
            document.getElementById("enigma-val-mision-3").className = `milestone-val ${cls}`;
            document.getElementById("enigma-label-mision-3").className = `milestone-label ${cls}`;
          } else {
            document.getElementById("enigma-val-mision-3").textContent = "EN CURSO...";
            document.getElementById("enigma-val-mision-3").className = "milestone-val text-warning";
            document.getElementById("enigma-label-mision-3").className = "milestone-label text-warning";
          }

        } else {
          document.getElementById("enigma-val-mision-2").textContent = "EN CURSO...";
          document.getElementById("enigma-val-mision-2").className = "milestone-val text-warning";
          document.getElementById("enigma-label-mision-2").className = "milestone-label text-warning";
          
          document.getElementById("enigma-val-mision-3").textContent = "BLOQUEADA";
          document.getElementById("enigma-val-mision-3").className = "milestone-val text-muted";
          document.getElementById("enigma-label-mision-3").className = "milestone-label text-muted";
        }

      } else {
        document.getElementById("enigma-val-mision-1").textContent = "EN CURSO...";
        document.getElementById("enigma-val-mision-1").className = "milestone-val text-warning";
        document.getElementById("enigma-label-mision-1").className = "milestone-label text-warning";

        document.getElementById("enigma-val-mision-2").textContent = "BLOQUEADA";
        document.getElementById("enigma-val-mision-2").className = "milestone-val text-muted";
        document.getElementById("enigma-val-mision-3").textContent = "BLOQUEADA";
        document.getElementById("enigma-val-mision-3").className = "milestone-val text-muted";
      }

      // Fin de Operación
      if (data.tiempo_fin) {
        const end = data.tiempo_fin.toDate();
        document.getElementById("enigma-val-mision-final").textContent = end.toLocaleTimeString();
        document.getElementById("enigma-val-mision-final").className = "milestone-val text-green";
      } else {
        document.getElementById("enigma-val-mision-final").textContent = "--:--:--";
        document.getElementById("enigma-val-mision-final").className = "milestone-val text-muted";
      }

    } else {
      if (startTimeEl) startTimeEl.textContent = "TIEMPO: --:--:--";
      document.getElementById("enigma-val-mision-inicio").textContent = "--:--:--";
      document.getElementById("enigma-val-mision-inicio").className = "milestone-val text-muted";
      document.getElementById("enigma-val-mision-1").textContent = "PENDIENTE";
      document.getElementById("enigma-val-mision-1").className = "milestone-val text-muted";
      document.getElementById("enigma-label-mision-1").className = "milestone-label text-muted";
      document.getElementById("enigma-val-mision-2").textContent = "BLOQUEADA";
      document.getElementById("enigma-val-mision-2").className = "milestone-val text-muted";
      document.getElementById("enigma-label-mision-2").className = "milestone-label text-muted";
      document.getElementById("enigma-val-mision-3").textContent = "BLOQUEADA";
      document.getElementById("enigma-val-mision-3").className = "milestone-val text-muted";
      document.getElementById("enigma-label-mision-3").className = "milestone-label text-muted";
      document.getElementById("enigma-val-mision-final").textContent = "--:--:--";
      document.getElementById("enigma-val-mision-final").className = "milestone-val text-muted";
    }

    // Config Cita Inputs (Solo si el admin no está editándolos en ese instante)
    const inputDia = document.getElementById("enigma-cfg-cita-dia");
    const inputHora = document.getElementById("enigma-cfg-cita-hora");

    if (inputDia && document.activeElement !== inputDia) {
      inputDia.value = data.cita_dia || "";
    }
    if (inputHora && document.activeElement !== inputHora) {
      inputHora.value = data.cita_hora || "";
    }
  });

  // 2. Escuchar Agentes (Integrantes)
  const membersRef = collection(db, "grupos", ENIGMA_GROUP_ID, "integrantes");
  enigmaMembersUnsub = onSnapshot(membersRef, (snapshot) => {
    const listEl = document.getElementById("enigma-agents-list");
    if (!listEl) return;

    listEl.innerHTML = "";

    if (snapshot.empty) {
      listEl.innerHTML = `<div class="loading-tactical" style="color: var(--color-warning);">No hay agentes registrados en el sistema.</div>`;
      return;
    }

    // Contadores rápidos para sumario
    let total = 0, validados = 0, enPosicion = 0;

    snapshot.forEach((docSnap) => {
      total++;
      const data = docSnap.data();
      const id = docSnap.id;

      if (data.validado) validados++;
      if (data.llegado) enPosicion++;

      const connClass = data.validado ? "active" : "inactive";
      const connText = data.validado ? "Autenticado y Activo" : "Desconectado";
      
      const posClass = data.llegado ? "active" : "warn";
      const posText = data.llegado ? "En Posición" : "En Movimiento";

      const card = document.createElement("div");
      card.className = "agent-card-integrated";
      card.innerHTML = `
        <div class="agent-header-row">
          <span class="agent-name-t">👤 AGENTE: ${data.nombre || "DESCONOCIDO"}</span>
          <span class="agent-code-t">ID-ACCESO: ${data.codigo_individual || "N/A"}</span>
        </div>
        <div class="agent-status-row">
          <span class="status-row-label">ESTADO DE RED:</span>
          <span class="status-badge-val ${connClass}">${connText}</span>
        </div>
        <div class="agent-status-row">
          <span class="status-row-label">PUNTO DE REUNIÓN:</span>
          <span class="status-badge-val ${posClass}">${posText}</span>
        </div>
        <div class="agent-actions-row">
          <button class="btn-secondary btn-sm" style="padding: 0.35rem 0.6rem; font-size: 0.75rem;" onclick="window.toggleValidadoEnigma('${id}', ${data.validado})">
            ${data.validado ? "🚫 Desactivar Red" : "✅ Activar Red"}
          </button>
          <button class="btn-secondary btn-sm" style="padding: 0.35rem 0.6rem; font-size: 0.75rem;" onclick="window.toggleLlegadoEnigma('${id}', ${data.llegado})">
            ${data.llegado ? "🏃 Marcar Ausente" : "🚩 Marcar Presente"}
          </button>
          <button class="btn-secondary btn-sm" style="padding: 0.35rem 0.6rem; font-size: 0.75rem;" onclick="window.editarCodigoAgenteEnigma('${id}', '${data.codigo_individual}')">
            ✏️ Código
          </button>
          <button class="btn-danger btn-sm" style="padding: 0.35rem 0.6rem; font-size: 0.75rem; border-color: rgba(239,68,68,0.3);" onclick="window.eliminarAgenteEnigma('${id}', '${data.nombre}')">
            Eliminar
          </button>
        </div>
      `;
      listEl.appendChild(card);
    });

    // Añadir resumen visual al principio de la lista
    const summary = document.createElement("div");
    summary.style.background = "rgba(139, 92, 246, 0.1)";
    summary.style.border = "1px solid rgba(139, 92, 246, 0.2)";
    summary.style.borderRadius = "10px";
    summary.style.padding = "0.6rem";
    summary.style.textAlign = "center";
    summary.style.fontSize = "0.8rem";
    summary.style.fontWeight = "700";
    summary.style.color = "var(--color-violet)";
    summary.style.marginBottom = "0.5rem";
    summary.innerText = `AGENTES: ${total} | ACTIVOS: ${validados} | EN POSICIÓN: ${enPosicion}`;
    listEl.insertBefore(summary, listEl.firstChild);
  });

  // 3. Escuchar Mensajes de Chat
  const chatRef = collection(db, "grupos", ENIGMA_GROUP_ID, "mensajes");
  const chatQuery = query(chatRef, orderBy("timestamp", "asc"), limit(100));
  enigmaChatUnsub = onSnapshot(chatQuery, (snapshot) => {
    const container = document.getElementById("enigma-chat-messages");
    if (!container) return;

    container.innerHTML = "";

    if (snapshot.empty) {
      container.innerHTML = `<div class="msg-sys">[ CANAL DE EMERGENCIAS LIMPIO — ESPERANDO TRANSMISIONES ]</div>`;
      return;
    }

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const isHQ = data.sender === "HQ";
      
      const time = data.timestamp 
        ? new Date(data.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        : "--:--";
      
      const senderName = isHQ ? "MANDO CENTRAL (TÚ)" : "AGENTE DE CAMPO";
      
      const msgDiv = document.createElement("div");
      msgDiv.className = `msg-wrapper ${isHQ ? 'msg-hq' : 'msg-agent'}`;
      msgDiv.innerHTML = `
        <div class="msg-header">
          <span>${senderName}</span>
          <span style="opacity: 0.6; font-size: 0.7rem;">${time}</span>
        </div>
        <div class="msg-content">${data.text || ""}</div>
      `;
      container.appendChild(msgDiv);
    });

    // Auto-scroll al final
    container.scrollTop = container.scrollHeight;
  });

  // 4. Escuchar Solicitudes de Reclutamiento (Colección contactos de la landing)
  const contactsRef = collection(db, "contactos");
  const contactsQuery = query(contactsRef, orderBy("timestamp", "desc"), limit(30));
  enigmaContactsUnsub = onSnapshot(contactsQuery, (snapshot) => {
    const listEl = document.getElementById("enigma-contact-requests-list");
    if (!listEl) return;

    listEl.innerHTML = "";

    if (snapshot.empty) {
      listEl.innerHTML = `<div class="loading-tactical">No hay reclutamientos registrados en la base de datos.</div>`;
      return;
    }

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;
      const readClass = data.visto ? "read" : "unread";
      const dateText = data.timestamp ? data.timestamp.toDate().toLocaleString("es-ES") : "--/--";

      const card = document.createElement("div");
      card.className = `contact-card-integrated ${readClass}`;
      card.innerHTML = `
        <div class="contact-card-header">
          <span class="contact-sender">👤 ${data.nombre || "Anónimo"}</span>
          <span class="contact-date">${dateText}</span>
        </div>
        <div class="contact-msg">"${data.mensaje || ""}"</div>
        <div class="contact-email">📧 Email: <strong>${data.email || "N/A"}</strong></div>
        <div class="contact-actions">
          <button class="btn-secondary btn-sm" style="padding: 0.3rem 0.5rem; font-size: 0.75rem;" onclick="window.toggleVistoContactoEnigma('${id}', ${data.visto || false})">
            ${data.visto ? "↩️ Marcar Nuevo" : "👁️ Archivar"}
          </button>
          <button class="btn-danger btn-sm" style="padding: 0.3rem 0.5rem; font-size: 0.75rem; border-color: rgba(239,68,68,0.3);" onclick="window.eliminarContactoEnigma('${id}')">
            Eliminar
          </button>
        </div>
      `;
      listEl.appendChild(card);
    });
  });
}

function stopEnigmaListeners() {
  console.log("Apagando escuchas de Operación Enigma...");
  if (enigmaGroupUnsub) { enigmaGroupUnsub(); enigmaGroupUnsub = null; }
  if (enigmaMembersUnsub) { enigmaMembersUnsub(); enigmaMembersUnsub = null; }
  if (enigmaChatUnsub) { enigmaChatUnsub(); enigmaChatUnsub = null; }
  if (enigmaContactsUnsub) { enigmaContactsUnsub(); enigmaContactsUnsub = null; }
  if (enigmaTimerInterval) { clearInterval(enigmaTimerInterval); enigmaTimerInterval = null; }
}

// ------------------------------------------------------------
// LOGICA CHAT Y CRONOMETRO
// ------------------------------------------------------------

async function enviarMensajeEnigma() {
  const input = document.getElementById("enigma-chat-input");
  if (!input) return;
  
  const text = input.value.trim();
  if (!text) return;

  const btn = document.getElementById("enigma-btn-send-chat");
  if (btn) btn.disabled = true;
  input.value = "";

  try {
    const messagesRef = collection(db, "grupos", ENIGMA_GROUP_ID, "mensajes");
    await addDoc(messagesRef, {
      text: text,
      sender: "HQ",
      timestamp: serverTimestamp()
    });
  } catch (err) {
    console.error("Error al enviar directriz de HQ:", err);
    alert("Error al enviar mensaje: " + err.message);
  } finally {
    if (btn) btn.disabled = false;
    input.focus();
  }
}

function iniciarContadorEnigma(firebaseTimestamp) {
  if (enigmaTimerInterval) clearInterval(enigmaTimerInterval);

  const startTime = firebaseTimestamp.toDate().getTime();
  const TOTAL_TIME = 2 * 60 * 60 * 1000; // 2 horas de juego
  const endTime = startTime + TOTAL_TIME;

  const timerEl = document.getElementById("enigma-mission-timer");
  if (!timerEl) return;

  function update() {
    const now = Date.now();
    const diff = endTime - now;

    if (diff <= 0) {
      // Tiempo excedido (Overtime)
      const over = Math.abs(diff);
      const oh = Math.floor(over / (1000 * 60 * 60));
      const om = Math.floor((over % (1000 * 60 * 60)) / (1000 * 60));
      const os = Math.floor((over % (1000 * 60)) / 1000);

      const pH = oh < 10 ? "0" + oh : oh;
      const pM = om < 10 ? "0" + om : om;
      const pS = os < 10 ? "0" + os : os;

      timerEl.innerText = `+${pH}:${pM}:${pS}`;
      timerEl.style.color = "var(--color-warning)";
    } else {
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      const fH = h < 10 ? "0" + h : h;
      const fM = m < 10 ? "0" + m : m;
      const fS = s < 10 ? "0" + s : s;

      timerEl.innerText = `${fH}:${fM}:${fS}`;
      timerEl.style.color = "var(--color-danger)";
    }
  }

  update();
  enigmaTimerInterval = setInterval(update, 1000);
}

// ------------------------------------------------------------
// FUNCIONES GLOBALES (ACCIONES EN AGENTES Y CONTACTOS)
// ------------------------------------------------------------

window.toggleValidadoEnigma = async function (docId, currentValue) {
  try {
    const docRef = doc(db, "grupos", ENIGMA_GROUP_ID, "integrantes", docId);
    await updateDoc(docRef, { validado: !currentValue });
  } catch (err) {
    console.error("Error al actualizar red del agente:", err);
  }
};

window.toggleLlegadoEnigma = async function (docId, currentValue) {
  try {
    const docRef = doc(db, "grupos", ENIGMA_GROUP_ID, "integrantes", docId);
    await updateDoc(docRef, { llegado: !currentValue });
  } catch (err) {
    console.error("Error al actualizar presencia del agente:", err);
  }
};

window.editarCodigoAgenteEnigma = async function (docId, currentCode) {
  const newCode = prompt("Introduce el nuevo código de acceso para este agente:", currentCode);
  if (newCode !== null && newCode.trim() !== "") {
    try {
      const docRef = doc(db, "grupos", ENIGMA_GROUP_ID, "integrantes", docId);
      await updateDoc(docRef, { codigo_individual: newCode.trim().toUpperCase() });
    } catch (err) {
      console.error("Error al editar código del agente:", err);
    }
  }
};

window.eliminarAgenteEnigma = async function (docId, name) {
  if (confirm(`¿Eliminar al agente ${name || "Desconocido"} de forma permanente?`)) {
    try {
      const docRef = doc(db, "grupos", ENIGMA_GROUP_ID, "integrantes", docId);
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Error al eliminar agente:", err);
    }
  }
};

window.toggleVistoContactoEnigma = async function (docId, currentValue) {
  try {
    const docRef = doc(db, "contactos", docId);
    await updateDoc(docRef, { visto: !currentValue });
  } catch (err) {
    console.error("Error al archivar contacto Enigma:", err);
  }
};

window.eliminarContactoEnigma = async function (docId) {
  if (confirm("¿Eliminar este registro de contacto de forma permanente?")) {
    try {
      const docRef = doc(db, "contactos", docId);
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Error al eliminar contacto Enigma:", err);
    }
  }
};
