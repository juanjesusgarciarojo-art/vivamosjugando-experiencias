# Manual del Mando Central (Dashboard) de ComoIguales

El **Mando Central** es la plataforma web de uso exclusivo interno que permite gestionar todas las experiencias de "Vivamos Jugando", coordinar al personal y atender las peticiones de contacto en tiempo real. 

---

## 1. Funcionalidades Principales

El Dashboard está estructurado en pestañas de acceso rápido:

1. **Dashboard (Inicio):** Vista general de estadísticas rápidas, últimas solicitudes de contacto y estado general del sistema.
2. **Calendario de Eventos:** Gestión visual de fechas para eventos y reservas de experiencias.
3. **Buzón de Solicitudes:** Visualización de mensajes enviados por clientes desde la landing page (formulario de contacto).
4. **Clientes (Base de Datos):** Registro de participantes y clientes, con sus datos de contacto y notas internas.
5. **Personal (Gestores):** Registro de monitores autorizados para operar la plataforma y sus respectivos roles.
6. **Experiencias:** El mando de control en tiempo real para juegos activos (ej: Operación Enigma).
7. **Correo Corporativo:** Bandeja de entrada integrada para leer y responder correos `@vivamosjugando.com`.
8. **Auditoría (Historial):** Registro inalterable de acciones de administración.

---

## 2. Perfiles de Usuario y Roles

La plataforma diferencia los permisos según dos roles de usuario:

### 👤 Administrador (Propietario / Coordinador General)
El Administrador tiene control total sobre el sistema y puede realizar acciones críticas.
* **Acciones Exclusivas:**
  * Crear y dar de alta a nuevos usuarios (Administradores o Gestores).
  * Eliminar registros de clientes de la base de datos.
  * Asignar un correo corporativo específico a cada usuario del personal.
  * Decidir qué usuarios tienen permiso de lectura y respuesta para el correo genérico de contacto (`contacto@vivamosjugando.com`).
  * Configurar la contraseña cifrada del buzón genérico en la base de datos Firestore.
  * Visualizar la pestaña de **Auditoría** (Historial de acciones).
  * Limpiar el historial de auditoría si es necesario.

### 👥 Gestor / Monitor (Personal de Campo / Game Masters)
El Gestor es el personal encargado de ejecutar las experiencias sobre el terreno y atender el soporte habitual. Su acceso es limitado por motivos de seguridad y privacidad de datos.
* **Acciones Permitidas:**
  * Visualizar el calendario y las solicitudes de contacto.
  * Ver el listado de clientes y editar sus notas de seguimiento (pero **no** eliminarlos).
  * Controlar y monitorizar las experiencias en vivo (Operación Enigma, Gymkanas).
  * Consultar su buzón de correo corporativo asignado introduciendo su contraseña al iniciar su sesión de trabajo.
  * Leer y responder al buzón genérico de contacto de la organización (únicamente si el Administrador le ha otorgado el acceso en su perfil).
* **Restricciones:**
  * No tiene acceso a la pestaña de Personal (Gestores). No puede crear ni borrar cuentas de compañeros.
  * No puede ver la pestaña de Auditoría.
  * No puede eliminar clientes de la base de datos.

---

## 3. Seguridad y Trazabilidad

Todo lo que ocurre en el panel queda registrado en el historial de **Auditoría**. Cada vez que un usuario (tanto Administrador como Gestor) realiza una acción relevante (ej: iniciar la Operación Enigma, cambiar la cita a un escuadrón, guardar una nota de cliente), el sistema guarda:
- Qué acción se realizó.
- Nombre del usuario y rol que la ejecutó.
- Fecha y hora exacta.
- Detalles del cambio.

Esto garantiza un control total del proyecto y permite detectar errores operativos rápidamente.
