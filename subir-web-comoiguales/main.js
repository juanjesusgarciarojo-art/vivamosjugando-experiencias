/* ============================================================
   VIVAMOS JUGANDO — main.js
   Funcionalidad: Nav, Animaciones de Scroll y Formulario de Eventos
   ============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, arrayUnion, addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDC93yT8bBGZvzz6TTjngY7rTX-vgT-rTw",
  authDomain: "el-reto-de-tu-vida.firebaseapp.com",
  projectId: "el-reto-de-tu-vida",
  storageBucket: "el-reto-de-tu-vida.firebasestorage.app",
  messagingSenderId: "436879361667",
  appId: "1:436879361667:web:94dffea44b14787d057db6"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {

  // ── 1. NAVEGACIÓN Y HEADER SCROLL ────────────────────────
  const header = document.querySelector('header');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      
      // Animación de hamburguesa a cruz
      const spans = hamburger.querySelectorAll('span');
      if (navLinks.classList.contains('open')) {
        spans[0].style.transform = 'rotate(45deg) translate(6px, 6px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(6px, -7px)';
      } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      }
    });

    // Cerrar menú móvil al hacer clic en un enlace de navegación
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        const spans = hamburger.querySelectorAll('span');
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      });
    });
  }

  // ── 2. REVEAL ANIMATIONS (Intersection Observer) ─────────
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  document.querySelectorAll('.reveal').forEach(element => {
    revealObserver.observe(element);
  });

  // ── 3. FORMULARIO DE ENCARGOS / EVENTOS A MEDIDA ──────────
  const eventsForm = document.getElementById('eventsForm');
  const formSuccess = document.getElementById('formSuccess');

  if (eventsForm) {
    eventsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const nombre = document.getElementById('eventNombre').value;
      const email = document.getElementById('eventEmail').value;
      const telefono = document.getElementById('eventTelefono').value;
      const tipo = document.getElementById('eventType').value;
      const mensaje = document.getElementById('eventMsg').value;
      const promociones = document.getElementById('eventPromo').checked;

      console.log('Guardando solicitud en Firebase...', { nombre, email, telefono, tipo, mensaje, promociones });

      // 1. Guardar en solicitudes_contacto
      addDoc(collection(db, 'solicitudes_contacto'), {
        nombre,
        email,
        telefono,
        tipo_evento: tipo,
        mensaje,
        fecha_solicitud: serverTimestamp(),
        estado: 'nuevo'
      }).catch(err => console.error("Error al guardar solicitud:", err));

      // 2. Guardar o actualizar la ficha del cliente
      const clienteRef = doc(db, 'clientes', email.toLowerCase());
      setDoc(clienteRef, {
        nombre,
        telefono,
        recibir_promociones: promociones,
        consultas: arrayUnion({
          fecha: new Date().toISOString(),
          tipo_evento: tipo,
          mensaje: mensaje
        })
      }, { merge: true }).catch(err => console.error("Error al guardar cliente:", err));

      // Transición visual suave al estado de éxito
      eventsForm.style.opacity = '0';
      setTimeout(() => {
        eventsForm.style.display = 'none';
        if (formSuccess) {
          formSuccess.style.display = 'block';
          formSuccess.style.opacity = '0';
          setTimeout(() => {
            formSuccess.style.opacity = '1';
          }, 50);
        }
      }, 300);
    });
  }
});
