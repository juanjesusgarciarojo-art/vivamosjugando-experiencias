# Contexto de Trabajo: Dashboard "Mando Central" - ComoIguales / VivamosJugando

Este documento sirve como puente de comunicación e historial de decisiones para mantener todo el contexto técnico, arquitectónico y operativo del proyecto al trasladarlo a un nuevo espacio de trabajo.

---

## 1. Información General del Proyecto
* **Nombre de la Aplicación:** Mando Central / Dashboard de Gestión de Experiencias.
* **Cliente / Organización:** ComoIguales (vivamosjugando.com).
* **Propósito:** Panel de administración y control en tiempo real de experiencias de escape room/juegos interactivos (como "Operación Enigma"), gestión de reservas, base de datos de clientes, historial de auditoría y buzón de correo corporativo unificado.
* **Arquitectura:** Aplicación web cliente-servidor estructurada como **PWA (Progressive Web App)** con soporte offline mediante Service Worker.
* **Tecnologías Core:**
  - **Frontend:** HTML5, CSS3 (Vanilla CSS, paleta de colores oscuros/glassmorphism), JavaScript Vanilla (ES Modules).
  - **Base de Datos / Autenticación:** Firebase Firestore y Firebase Authentication.
  - **Backend (Puente de Correo):** PHP 8 (para la conexión segura IMAP/SMTP con el servidor de Hostinger).

---

## 2. Módulos y Arquitectura Técnica

### A. Integración de Correo Corporativo (IMAP/SMTP)
* **Objetivo:** Permitir el uso de correos `@vivamosjugando.com` sin exponer al proveedor de hosting (Hostinger) en la interfaz (política de marca blanca).
* **Ficheros Implicados:**
  - [mail_bridge.php](file:///c:/Users/Juan%20Jes%C3%BAs/OneDrive/Aplicaciones/La%20Orden/gestion-experiencias/mail_bridge.php): Script en PHP que realiza la conexión por socket seguro.
    - **IMAP (Puerto 993 / SSL):** Descarga listados, carpetas (INBOX, Sent) y cuerpos de mensaje.
    - **SMTP (Puerto 465 / SSL):** Envío directo de emails. Esto garantiza la entrega directa al servidor de destino y evita que los correos terminen en la carpeta de SPAM (lo que ocurriría con la función `mail()` estándar de PHP).
* **Gestión de Seguridad de Contraseñas:**
  - **Cuentas Personales:** La clave del email corporativo de cada monitor **nunca se guarda en base de datos**. Al iniciar sesión en el apartado de Correo, el usuario introduce su clave en memoria (`emailState.personalPassword`). Esta clave se destruye de la memoria tan pronto como el usuario sale de la pestaña o refresca la página.
  - **Cuenta General (`contacto@vivamosjugando.com`):** La contraseña de esta cuenta la guarda un Administrador una sola vez desde la pestaña de Equipo. Se guarda de forma segura en el documento Firestore `configuraciones_sistema/email_config`. Los gestores autorizados pueden leer y responder emails de este buzón sin conocer la contraseña física de la cuenta.

### B. Gestión del Equipo (Gestores y Administradores)
* **Objetivo:** Registro, edición y baja de miembros del equipo con roles diferenciados:
  - `admin`: Acceso completo a todas las vistas, configuración de emails y gestión de personal.
  - `gestor`: Acceso limitado a su propia agenda y experiencias asignadas.
* **Registro de Usuarios sin Cierre de Sesión:**
  - Implementado en `dashboard.js` (`setupGestoresForm`) usando una **instancia secundaria de Firebase App** en memoria. Esto permite al administrador registrar nuevos usuarios en Firebase Authentication sin que la sesión del administrador actual se cierre de forma automática por el SDK.
* **Modificación de Miembros (Implementación Reciente):**
  - Botones **"✏️ Editar"** y **"🗑️ Eliminar"** visibles únicamente para usuarios administradores en la vista de Equipo.
  - El modal de edición (`editGestorModal`) permite actualizar Nombre, Teléfono, Rol, Correo Corporativo Asignado y Permiso de acceso al buzón de contacto general.
  - Al editar el perfil propio, la interfaz se refresca de inmediato en la barra lateral sin requerir recarga completa de la página.
  - Seguridad: Se bloquea la posibilidad de que el administrador activo se elimine a sí mismo.

### C. Integración de Operación Enigma
* **Consola de Control:** Panel en tiempo real para interactuar con los jugadores durante la partida activa.
* **Chat en tiempo real:** Comunicación directa mediante Firestore entre el monitor (Gestor) y el grupo de jugadores.
* **Cuenta atrás:** Sincronización del temporizador del juego.
* **Misiones:** Gestión de hasta 4 misiones ligadas dinámicamente a la consola principal de control.

### D. Sistema de Caché PWA y Service Worker
* **Objetivo:** Garantizar que los cambios en el código se propaguen inmediatamente a los navegadores de los usuarios y a la aplicación PWA instalada, saltándose la caché agresiva del navegador.
* **Solución:**
  - Versión del Service Worker (`sw.js`) gestionada bajo una variable `CACHE_NAME` (actualmente `comoiguales-dashboard-v1.0.7`).
  - Las llamadas a recursos dinámicos en `index.html` incluyen query strings de versión (por ejemplo, `dashboard.js?v=1.0.6` y `dashboard.css?v=1.0.6`).
  - Al actualizar estos valores, el Service Worker detecta cambios en el archivo `sw.js`, instala la nueva versión en segundo plano y purga las cachés antiguas de inmediato.

### E. Carpeta `/vanila/` (Plantilla Base para Nuevas Experiencias)
* **Objetivo:** Boilerplate limpio para el desarrollo ágil de futuras salas o juegos.
* **Componentes:**
  - Un archivo `index.html` principal que ejerce de lobby/pantalla principal con temporizador cuenta atrás incorporado.
  - Cuatro páginas HTML de misiones asociadas.
  - Un chat interactivo integrado para que los participantes se comuniquen con el Gestor de la partida.
  - Estructura PWA (`manifest.json` y `sw.js` listos para configurar offline).

---

## 3. Estado Actual del Proyecto y Últimas Tareas Realizadas
* **Última Acción:** Se han integrado y verificado los eventos de edición y eliminación de miembros del equipo en `dashboard.js` y `index.html`.
* **Distribución:** Todos los archivos corregidos del Mando Central se han copiado a la carpeta `subir-web-comoiguales/gestion-experiencias/`.
* **Resguardo (Backup):** Cambios confirmados y subidos a la rama `enigma-pwa-dashboard` de GitHub.

---

## 4. Estructura de Ficheros Clave
* `/gestion-experiencias/index.html`: Estructura base del Dashboard, navegación y modales de edición.
* `/gestion-experiencias/dashboard.js`: Lógica completa de Firestore, autenticación, correo, PWA e inicializaciones.
* `/gestion-experiencias/dashboard.css`: Estilos visuales de la aplicación.
* `/gestion-experiencias/mail_bridge.php`: Script PHP puente para IMAP y SMTP.
* `/gestion-experiencias/sw.js`: Service worker para almacenamiento en caché local.
* `/vanila/`: Carpeta plantilla para el desarrollo de nuevas experiencias PWA.
* `/documentación/`: Contiene los manuales técnicos (`estructura_proyecto_vivamosjugando.md`, `dashboard_comoiguales.md`, `guia_administrador.md`, `guia_gestor.md`).

---

## 5. Próximos Pasos (Tras cambiar de directorio)
1. **Subir archivos actualizados:** Subir el contenido de `subir-web-comoiguales/gestion-experiencias/` al hosting web mediante FTP reemplazando los anteriores.
2. **Entrar al panel y editar perfil:** Acceder al Dashboard como administrador, ir a "Equipo", editar tu propia tarjeta y añadir tu correo corporativo.
3. **Configurar buzón de contacto:** Configurar la contraseña de `contacto@vivamosjugando.com` en la misma sección.
4. **Verificación final:** Ir a la pestaña Correo, introducir la contraseña asignada a tu cuenta para desbloquear e iniciar pruebas de lectura y envío de emails corporativos.
