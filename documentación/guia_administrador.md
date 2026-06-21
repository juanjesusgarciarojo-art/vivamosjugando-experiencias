# Guía de Inicio: Rol Administrador (Mando Central)

¡Bienvenido al panel de control de **ComoIguales**! Como administrador, tienes la máxima responsabilidad en la plataforma. Este documento te servirá de guía para saber qué puedes hacer y cómo gestionar el día a día.

---

## 🔑 Tus Funciones y Responsabilidades

### 1. Gestión de Personal (Gestores/Monitores) y Correo Corporativo
Eres el único que puede dar acceso al panel a otras personas y asignar sus recursos de comunicación.
* **Cómo crear un nuevo usuario:**
  1. Ve a la pestaña **Personal** en el menú de la izquierda.
  2. Rellena los datos (Nombre, Correo, Teléfono, Contraseña y Rol).
  3. Haz clic en "Añadir Personal".
  * *Nota de seguridad:* El sistema creará el usuario de manera segura en la base de datos sin interferir en tu sesión activa.
* **Asignar Correo Corporativo:** Al crear o editar a un miembro del personal, puedes especificar el **Correo Corporativo Asignado** (ej: `lucia@vivamosjugando.com`).
* **Permitir Acceso a Contacto:** En la ficha del gestor verás un interruptor llamado "Acceso Correo de Contacto". Si lo activas, el monitor podrá leer y responder los mensajes dirigidos a `contacto@vivamosjugando.com` directamente desde su panel.
* **Contraseña del Correo Genérico:** En la configuración del sistema, puedes establecer la contraseña de `contacto@vivamosjugando.com`. Esta contraseña se guardará encriptada en Firebase y permitirá a los usuarios autorizados acceder a la cuenta de soporte sin conocer la contraseña real.

### 2. Gestión de Clientes y Datos Sensibles
Tienes acceso a la base de datos de los participantes recopilados a través de los formularios.
* **Modificar y Guardar:** Puedes actualizar notas de seguimiento o corregir teléfonos directamente desde la tabla de clientes.
* **Eliminar Clientes:** Si un cliente solicita ser dado de baja o sus datos son erróneos, tú eres el único con el botón 🗑️ (Eliminar) disponible para borrar su ficha de forma permanente de Firebase.

### 3. Supervisión de Operación Enigma
Desde la sección de **Experiencias -> Operación Enigma** puedes:
* Dar de alta los códigos individuales de los agentes (ej: `AG-01`) que participarán en la partida.
* Configurar la cita (Día y Hora) que se mostrará a los jugadores en su pantalla.
* Enviar directrices o pistas por el chat encriptado directo al móvil del escuadrón.
* Forzar la finalización de la partida con el código de finalización maestro.

### 4. Auditoría de Seguridad (Historial)
Solo tú puedes ver qué ha hecho cada monitor.
* Ve a la pestaña **Auditoría** para ver el registro en tiempo real de quién ha entrado, modificado notas, creado gestores o eliminado clientes.
* En caso de necesitarlo, puedes usar el botón de limpiar el historial para reiniciar el registro de eventos antiguos.

---

## ⚠️ Recomendaciones de Seguridad
- **No compartas tu contraseña:** Como Administrador puedes borrar datos de forma irreversible.
- **Crea cuentas individuales:** Nunca compartas tu cuenta de administrador con monitores o gestores. Si un monitor necesita entrar, créale su propia cuenta de rol **Gestor**.
- **Cierra sesión:** Si usas un ordenador compartido en el campamento o en las oficinas de los clientes, recuerda cerrar tu sesión al finalizar la jornada.
