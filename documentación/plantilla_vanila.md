# Documentación: Plantilla "Vanilla" para Nuevas Experiencias

He creado una carpeta base llamada `/vanila/` en la raíz de tu proyecto para servir como plantilla limpia para cualquier nuevo juego o escape room exterior que quieras desarrollar en el futuro. 

---

## 1. Estructura de Archivos Creados
La plantilla incluye la estructura completa y la lógica básica de la Operación Enigma, totalmente modularizada y limpia:

- 🌐 **`index.html`:** La pantalla principal del juego. Contiene:
  - Pantalla de acceso por código.
  - Lobby de espera (con soporte de briefing/vídeo).
  - Interfaz de juego con cronómetro y selector de misiones en grid.
  - Módulo de chat en tiempo real con HQ integrado.
- 🎨 **`styles.css`:** Los estilos premium unificados con variables personalizables (colores neón, fuentes, responsive design para móviles y tablets, animaciones de entrada, etc.).
- ⚙️ **`app.js`:** Lógica en JavaScript modular que incluye la estructura del temporizador, el chat simulado (con respuestas automáticas del HQ para pruebas locales) y la conexión simulada a Firebase.
- 🧭 **`mision1.html` a `mision4.html`:** Las 4 páginas de misiones conectadas con el archivo principal. Cada una incluye un acertijo de muestra y validación de respuesta local que desbloquea la siguiente misión.
- 📱 **`manifest.json` y `sw.js`:** Los archivos de configuración PWA listos para que la experiencia sea descargable y jugable en móviles sin conexión (App Shell Cache).

---

## 2. Elementos que se han puesto como BASE:
1. **Lobby de Espera y Control de Despliegue:** Una sala de espera inicial controlada por el GM/HQ.
2. **Sincronización del Cronómetro:** Temporizador visible arriba en todo momento.
3. **Chat de Emergencia Directo:** Caja de mensajería con scroll automático hacia el último mensaje y estilo diferenciado según remitente (Tú / HQ / Sistema).
4. **Validación de Respuestas y Desbloqueo de Fases:** Cada misión comprueba la solución introducida y guarda el progreso en `localStorage` (permitiendo que el jugador regrese al menú principal y vea qué misiones se han desbloqueado).

---

## 3. Elementos Propuestos para MEJORAR la Experiencia del Jugador (Nuevas Ideas):

Para futuros juegos, te recomiendo incorporar estas características que llevarán la inmersión al siguiente nivel:

### A. Escáner de Códigos QR Integrado
* **Qué es:** En lugar de que los jugadores tengan que teclear un código que encuentren en un monumento o papel físico, la propia aplicación puede abrir la cámara del móvil y escanear un código QR.
* **Beneficio:** Hace el juego mucho más dinámico, interactivo y evita fallos de escritura de los participantes.

### B. Sistema de Pistas Autogestionadas con Penalización
* **Qué es:** Añadir un botón de *"Solicitar Pista"* en las misiones. El juego les da la pista de forma automática, pero a cambio les penaliza restándoles 2 o 5 minutos del tiempo total del cronómetro.
* **Beneficio:** Los jugadores no se frustran si se encallan y no tienen que esperar a que el Game Master les responda por el chat si está muy ocupado con otros grupos.

### C. Sistema de Sonidos Inmersivos y Música de Tensión
* **Qué es:** Poner una música ambiental muy sutil de intriga o tensión de fondo, y que el juego reproduzca sonidos de alarma cuando falte poco tiempo o cuando fallen un código.
* **Beneficio:** La música y los efectos de sonido multiplican por diez la sensación de urgencia e inmersión en la historia.

### D. Modo Offline Seguro ("Caché de Respaldo")
* **Qué es:** Guardar todas las interacciones de chat y respuestas que haga el jugador de forma local si pierde la cobertura (muy común en calles estrechas o parques). Una vez que el móvil vuelve a tener internet, el sistema sincroniza todo automáticamente con Firebase en segundo plano.
* **Beneficio:** Evita que el juego se cuelgue o que el monitor pierda el rastro del grupo si se quedan sin datos temporalmente.
