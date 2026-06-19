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

  // Navegación Sidebar
  document.querySelectorAll(".nav-item").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetView = link.getAttribute("data-target");
      switchView(targetView);

      document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
      link.classList.add("active");
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

  // Actualizar Título
  const titleMap = {
    "view-inicio": ["Inicio", "Resumen general y próximas tareas"],
    "view-calendario": ["Calendario", "Planificación de experiencias contratadas"],
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
        <button class="btn-secondary" id="save-note-${c.email.replace(/[@.]/g, '_')}">Guardar</button>
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
