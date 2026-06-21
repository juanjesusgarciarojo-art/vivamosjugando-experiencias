# Documentación General del Proyecto: Vivamos Jugando

Este documento sirve como guía general para entender toda la estructura técnica y de producto del proyecto **Vivamos Jugando**. Su objetivo es que cualquier persona que se incorpore al equipo o revise los archivos comprenda rápidamente cómo están divididas las plataformas, qué experiencias existen, cuáles son aplicaciones descargables (PWA) y cómo se gestiona todo desde el centro de control.

---

## 1. Visión Global
El ecosistema de **Vivamos Jugando** se divide principalmente en tres grandes bloques:
1. **La Web Principal (Landing Page):** El escaparate comercial donde se muestran los servicios y experiencias.
2. **Las Experiencias Interactívas:** Las aplicaciones web que utilizan los jugadores el día de su actividad.
3. **El Dashboard de Gestión (HQ):** El panel de control interno para la monitorización en tiempo real.

---

## 2. La Web Principal (Landing Page)
Es la puerta de entrada pública al proyecto (la página de ventas e información). 
- **Tecnología:** HTML, CSS y JavaScript (Archivos raíz: `index.html`, `main.css`, `main.js`).
- **Función:** Presentar los servicios de "Como Iguales", mostrar el catálogo de experiencias disponibles y captar clientes.

---

## 3. Las Experiencias Interactívas

Son el núcleo de la jugabilidad. Están diseñadas para que los jugadores interactúen con la historia a través de sus teléfonos móviles.

### 3.1. Operación Enigma
- **Tipo:** Escape room interactivo exterior / Gincana tecnológica y de espionaje.
- **Ruta del directorio:** `/operacion-enigma/mision/`
- **Url Pública (Para jugadores):** `www.vivamosjugando.com/operacion-enigma/mision/`
- **Características Técnicas:**
  - **Es una PWA (Progressive Web App):** Cuenta con un archivo *Manifest* y un *Service Worker*. Esto significa que cuando el jugador abre el enlace en su móvil, se le pedirá que instale la aplicación, quedando un icono en su pantalla de inicio como una app nativa, funcionando a pantalla completa.
  - **Sincronizada en la Nube:** Utiliza **Firebase** para comunicarse con el sistema central en tiempo real, permitiendo desbloquear fases, registrar tiempos y chatear con el cuartel general (HQ).
  - **Estructura del Juego:** Dividida en Misión 1, Misión 2, Misión 3 y un reto final oculto llamado Operación Quimera.

### 3.2. Campamento de Verano (Gymkana Campamento)
- **Ruta del directorio:** `/campamento-verano/`
- **Estado Actual:** Experiencia orientada a retos cooperativos y aventura al aire libre para grupos. Actualmente proyectada como la próxima experiencia en integrarse plenamente al ecosistema digital en tiempo real.

---

## 4. El Dashboard de Gestión (HQ / Cuartel General)
- **Ruta del directorio:** `/gestion-experiencias/`
- **Url Interna:** `www.vivamosjugando.com/gestion-experiencias/` (o donde se acabe alojando en producción, de uso exclusivamente interno).
- **Tecnología:** HTML, CSS, JavaScript y conexión directa con Base de Datos en tiempo real de Google (Firebase Auth y Firestore).

**¿Para qué sirve?**
Es el "cerebro" operativo para el equipo de *Como Iguales*. Desde aquí, los administradores y gestores (Game Masters) pueden:
1. **Dar de alta a jugadores** generándoles códigos de acceso únicos.
2. **Controlar el progreso:** Ver en directo cuánto tiempo lleva cada equipo y si han avanzado en la misión.
3. **Comunicaciones (Chat en Vivo):** Enviar y recibir mensajes directamente al móvil de los jugadores simulando ser la "Agencia" o el cuartel general para dar pistas o resolver incidencias.
4. **Gestionar Personal:** Los administradores pueden dar de alta a nuevos gestores/monitores para que tengan acceso al panel de control.

---

## 5. Arquitectura Técnica y Base de Datos (Firebase)
El proyecto depende de la infraestructura de **Firebase (Google)** para funcionar de forma asíncrona y sincronizada:
- **Firebase Authentication:** Se encarga de la seguridad del panel de gestión (Dashboard), asegurando que solo el personal autorizado (Administradores o Gestores) pueda entrar.
- **Cloud Firestore (Base de Datos):** Es la base de datos en tiempo real donde se guarda la información de los escuadrones (integrantes, contraseñas, tiempos de inicio y fin, y el historial de mensajes de chat). Gracias a esto, si un jugador envía un mensaje, este aparece instantáneamente en la pantalla del ordenador del Game Master.

---

## 6. Sistema de Correo Corporativo Integrado
El Mando Central incluye una herramienta de comunicación interna que permite leer y responder los emails de `@vivamosjugando.com` sin salir de la plataforma.
- **Tecnología de Conexión:** Utiliza un script intermediario seguro en PHP (`mail_bridge.php`) que realiza la conexión por protocolos seguros contra el servidor de correo:
  - **Lectura:** Protocolo **IMAP** (Puerto seguro 993) para descargar y listar bandejas de entrada.
  - **Envío:** Protocolo **SMTP** con autenticación obligatoria (Puerto seguro 465) para garantizar la entregabilidad directa en la bandeja de entrada de los clientes, evitando el SPAM.
- **Acceso según Perfiles:** El Administrador asigna las direcciones a cada rol y decide quién tiene acceso al correo genérico de contacto (`contacto@vivamosjugando.com`). Los usuarios solo proveen su contraseña de forma temporal para iniciar la lectura.

---

## 7. Proceso de Actualización (Despliegue)
- La carpeta local de trabajo se refleja en el servidor o hosting final de `vivamosjugando.com`.
- Existe un directorio llamado `/subir-web-comoiguales/` que se utiliza como "bandeja de salida" para agrupar los archivos que han sufrido modificaciones y que están listos para ser arrastrados y copiados en el servidor final (FTP o panel de hosting), asegurando que los despliegues sean seguros y organizados.
