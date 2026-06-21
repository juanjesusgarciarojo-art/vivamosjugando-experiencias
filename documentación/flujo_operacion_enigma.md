# Flujo de la Experiencia: Operación Enigma

A continuación te detallo paso a paso cómo es la experiencia para el jugador y cuáles son las contraseñas clave integradas en el sistema.

## 1. Enlaces de Acceso
- **Portal de Jugadores:** [www.vivamosjugando.com/operacion-enigma/mision/](https://www.vivamosjugando.com/operacion-enigma/mision/)
  - *Es la web a la que deben acceder los jugadores desde sus móviles el día de la experiencia. Puedes facilitársela por WhatsApp o código QR.*
- **Panel de Control (HQ):** Se gestiona directamente desde tu sección de "Experiencias" en el Dashboard que acabamos de configurar en el host.

## 2. Flujo del Jugador (Paso a Paso)

1. **Acceso y Autenticación:** 
   El jugador entra al enlace de misión en su móvil. El sistema le pedirá su **Código de Agente** (por ejemplo, `AG-01`). Este código debe haber sido dado de alta previamente por ti (o por el gestor) en la pestaña "Gestionar Operación" del Dashboard.

2. **Lobby de Espera y Sincronización:** 
   Tras verificar su código, entra a una sala de espera táctica. Allí el sistema esperará hasta que todos los agentes estén listos y el cuartel general (tú) dé luz verde o avance la experiencia.

3. **Vídeo Introductorio:** 
   Comienza la inmersión con el vídeo del cuartel general (HQ) explicando la misión.

4. **Desbloqueo de Clave de Escuadrón:** 
   Finalizado el vídeo, la pantalla se vuelve amarilla y solicita la **Clave de Escuadrón**. Esta clave la configuras tú en la base de datos (por ejemplo, puede ser una palabra que se dice al final del vídeo). Al introducirla, el equipo accede oficialmente a la consola del agente.

5. **Consola del Agente (Desarrollo del Juego):**
   Una vez dentro, el jugador tiene acceso a un menú táctico donde verá:
   - Estado y tiempo restante.
   - Acceso a **Misión 1, Misión 2, Misión 3 y Operación Quimera** (desbloqueables según avancen).
   - Canal de comunicaciones encriptado (Chat en vivo con el Gestor/HQ).

## 3. Contraseñas Integradas en el Sistema

Aquí tienes las contraseñas exactas que están programadas en la experiencia y que el jugador (o tú) necesitaréis en ciertos puntos:

- **Contraseña de Operación Quimera:** `EXTINCION`
  - En la parte final de la Operación Quimera, tras analizar el terminal infectado, se desplegará un contenedor pidiendo una clave. Los jugadores deben deducir o introducir esta palabra para desactivar la amenaza.

- **Código de Finalización de Misión:** `ENIGMA_2026`
  - Cuando se acaba el juego y queréis detener el cronómetro y registrar que el grupo ha superado la experiencia, el sistema pide un código de finalización maestro. Este es el código por defecto, a menos que configures uno distinto en Firebase.

- **Contraseña local de Admin (Mando de Campo):** `mediokilo`
  - *(Nota interna)* Si el personal de campo utiliza la página interna y antigua `admin.html` que está en la carpeta misión, esta es la contraseña de acceso directo. (Aunque con tu nuevo super-dashboard de gestión, esta vista ya es secundaria).
