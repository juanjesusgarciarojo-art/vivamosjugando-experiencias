<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Recibir datos POST
$input = json_decode(file_get_contents("php://input"), true);
if (!$input) {
    $input = $_POST;
}

$action = isset($input['action']) ? $input['action'] : '';
$email = isset($input['email']) ? trim($input['email']) : '';
$password = isset($input['password']) ? $input['password'] : '';

if (!$action || !$email || !$password) {
    echo json_encode(["success" => false, "error" => "Faltan parámetros requeridos (action, email, password)."]);
    exit;
}

// Configuración de Hostinger
define('IMAP_SERVER', '{imap.hostinger.com:993/imap/ssl}');
define('SMTP_SERVER', 'ssl://smtp.hostinger.com');
define('SMTP_PORT', 465);

switch ($action) {
    case 'fetch_emails':
        $folder = isset($input['folder']) ? $input['folder'] : 'INBOX';
        fetchEmails($email, $password, $folder);
        break;
    case 'fetch_body':
        $msgId = isset($input['msg_id']) ? (int)$input['msg_id'] : 0;
        if (!$msgId) {
            echo json_encode(["success" => false, "error" => "ID de mensaje no proporcionado."]);
            exit;
        }
        fetchEmailBody($email, $password, $msgId);
        break;
    case 'send_email':
        $to = isset($input['to']) ? trim($input['to']) : '';
        $subject = isset($input['subject']) ? trim($input['subject']) : '';
        $body = isset($input['body']) ? trim($input['body']) : '';
        $replyToId = isset($input['reply_to_id']) ? trim($input['reply_to_id']) : ''; // Message-ID original si es respuesta
        
        if (!$to || !$subject || !$body) {
            echo json_encode(["success" => false, "error" => "Faltan datos del envío (to, subject, body)."]);
            exit;
        }
        sendEmailSMTP($email, $password, $to, $subject, $body, $replyToId);
        break;
    default:
        echo json_encode(["success" => false, "error" => "Acción no válida."]);
        break;
}

/**
 * Conecta y lista los correos de una carpeta
 */
function fetchEmails($username, $password, $folderName) {
    if (!function_exists('imap_open')) {
        echo json_encode(["success" => false, "error" => "La extensión PHP IMAP no está habilitada en el servidor."]);
        exit;
    }

    // Traducir carpeta de enviados si aplica
    $folderPath = IMAP_SERVER . $folderName;
    
    // Conectar a IMAP
    $mbox = @imap_open($folderPath, $username, $password, OP_HALFOPEN);
    if (!$mbox) {
        // Reintentar con banderas de desactivación de certificados SSL de Hostinger por si acaso
        $mbox = @imap_open($folderPath . "/novalidate-cert", $username, $password, OP_HALFOPEN);
    }
    
    if (!$mbox) {
        echo json_encode(["success" => false, "error" => "Error de autenticación: Contraseña incorrecta o cuenta inválida."]);
        exit;
    }

    // Abrir completamente la carpeta
    @imap_reopen($mbox, $folderPath);

    // Buscar todos los correos ordenados por fecha descendente
    $MC = @imap_check($mbox);
    $total = $MC ? $MC->Nmsgs : 0;
    
    $list = [];
    if ($total > 0) {
        // Obtener los últimos 50 correos para no sobrecargar
        $start = max(1, $total - 49);
        $end = $total;
        
        for ($i = $end; $i >= $start; $i--) {
            $header = @imap_headerinfo($mbox, $i);
            if (!$header) continue;

            $from = isset($header->from[0]) ? $header->from[0] : null;
            $fromName = "";
            $fromAddress = "";
            if ($from) {
                $fromAddress = $from->mailbox . "@" . $from->host;
                $fromName = isset($from->personal) ? imap_utf8($from->personal) : $fromAddress;
            }

            $subject = isset($header->subject) ? imap_utf8($header->subject) : "(Sin Asunto)";
            
            // Comprobar leído/no leído
            $unseen = ($header->Unseen == 'U' || $header->Recent == 'R') ? true : false;
            if (isset($header->Msgno)) {
                // Alternativa para ver si está leído
                $unseen = !isset($header->Flagged) && ($header->Unseen == 'U');
            }

            $list[] = [
                "msg_id" => $i,
                "msg_uid" => @imap_uid($mbox, $i),
                "subject" => $subject,
                "from_name" => $fromName,
                "from_email" => $fromAddress,
                "date" => date("Y-m-d H:i:s", $header->udate),
                "unseen" => $unseen
            ];
        }
    }

    @imap_close($mbox);
    echo json_encode(["success" => true, "emails" => $list]);
}

/**
 * Obtiene el cuerpo de un correo en HTML y Texto plano
 */
function fetchEmailBody($username, $password, $msgId) {
    $mbox = @imap_open(IMAP_SERVER . "INBOX", $username, $password);
    if (!$mbox) {
        $mbox = @imap_open(IMAP_SERVER . "INBOX/novalidate-cert", $username, $password);
    }
    
    if (!$mbox) {
        echo json_encode(["success" => false, "error" => "Error de autenticación al recuperar cuerpo."]);
        exit;
    }

    // Marcar como leído
    @imap_setflag_full($mbox, $msgId, "\\Seen");

    // Obtener estructura del mensaje
    $structure = @imap_fetchstructure($mbox, $msgId);
    $htmlBody = "";
    $textBody = "";

    if ($structure) {
        // Función recursiva para parsear partes
        parseStructure($mbox, $msgId, $structure, "", $htmlBody, $textBody);
    } else {
        $htmlBody = @imap_body($mbox, $msgId);
    }

    // Limpieza básica de codificación
    if (empty($htmlBody)) {
        $htmlBody = nl2br(htmlspecialchars($textBody));
    }

    // Intentar buscar el Message-ID original para hilos de respuesta
    $header = @imap_headerinfo($mbox, $msgId);
    $messageId = isset($header->message_id) ? trim($header->message_id) : '';

    @imap_close($mbox);

    echo json_encode([
        "success" => true,
        "message_id" => $messageId,
        "html" => $htmlBody,
        "text" => $textBody
    ]);
}

function parseStructure($mbox, $msgId, $part, $partNum, &$htmlBody, &$textBody) {
    // 0 = Text, 1 = Multipart, 2 = Message, etc.
    $type = $part->type;
    $subtype = strtoupper($part->subtype);

    // Formular el número de la parte (ej: "1.2")
    $pNum = ($partNum == "") ? "1" : $partNum;

    if ($type == 0) { // TEXT
        $data = @imap_fetchbody($mbox, $msgId, $pNum);
        
        // Decodificar según la transferencia
        if ($part->encoding == 3) { // BASE64
            $data = base64_decode($data);
        } elseif ($part->encoding == 4) { // QUOTED-PRINTABLE
            $data = quoted_printable_decode($data);
        }

        // Detectar Charset si es posible
        $charset = "UTF-8";
        if (isset($part->parameters)) {
            foreach ($part->parameters as $param) {
                if (strtolower($param->attribute) == 'charset') {
                    $charset = strtoupper($param->value);
                }
            }
        }
        
        if ($charset != "UTF-8" && $charset != "") {
            $data = @mb_convert_encoding($data, "UTF-8", $charset);
        }

        if ($subtype == 'HTML') {
            $htmlBody .= $data;
        } else {
            $textBody .= $data;
        }
    } elseif ($type == 1) { // MULTIPART
        if (isset($part->parts)) {
            foreach ($part->parts as $index => $subPart) {
                $subPartNum = ($partNum == "") ? ($index + 1) : ($partNum . "." . ($index + 1));
                parseStructure($mbox, $msgId, $subPart, $subPartNum, $htmlBody, $textBody);
            }
        }
    }
}

/**
 * Envía un correo electrónico mediante sockets SMTP directos
 */
function sendEmailSMTP($username, $password, $to, $subject, $body, $replyToId = '') {
    // Conectar a SMTP de Hostinger
    $socket = @fsockopen(SMTP_SERVER, SMTP_PORT, $errno, $errstr, 15);
    if (!$socket) {
        echo json_encode(["success" => false, "error" => "No se pudo conectar al servidor SMTP: $errstr ($errno)"]);
        exit;
    }

    getResponse($socket, "220");

    // Saludo
    fwrite($socket, "EHLO vivamosjugando.com\r\n");
    getResponse($socket, "250");

    // Iniciar Autenticación
    fwrite($socket, "AUTH LOGIN\r\n");
    getResponse($socket, "334");

    // Enviar Usuario Base64
    fwrite($socket, base64_encode($username) . "\r\n");
    getResponse($socket, "334");

    // Enviar Contraseña Base64
    fwrite($socket, base64_encode($password) . "\r\n");
    $authResponse = getResponse($socket, "235");
    if (strpos($authResponse, "235") === false) {
        fclose($socket);
        echo json_encode(["success" => false, "error" => "Error de autenticación SMTP: Usuario o contraseña incorrectos."]);
        exit;
    }

    // Remitente
    fwrite($socket, "MAIL FROM: <$username>\r\n");
    getResponse($socket, "250");

    // Destinatario
    fwrite($socket, "RCPT TO: <$to>\r\n");
    getResponse($socket, "250");

    // Iniciar datos del mensaje
    fwrite($socket, "DATA\r\n");
    getResponse($socket, "354");

    // Cabeceras y cuerpo
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: ComoIguales <$username>\r\n";
    $headers .= "To: <$to>\r\n";
    $headers .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
    $headers .= "Date: " . date('r') . "\r\n";
    
    // Si es respuesta a un hilo, inyectar Message-ID de cabecera de hilo
    if ($replyToId) {
        $headers .= "In-Reply-To: $replyToId\r\n";
        $headers .= "References: $replyToId\r\n";
    }

    // Crear un Message-ID propio para trazabilidad
    $msgId = "<" . time() . "." . uniqid() . "@vivamosjugando.com>";
    $headers .= "Message-ID: $msgId\r\n";

    // Enviar cabeceras, línea en blanco y cuerpo
    fwrite($socket, $headers . "\r\n" . $body . "\r\n.\r\n");
    $sendResponse = getResponse($socket, "250");

    // Salir de la conexión
    fwrite($socket, "QUIT\r\n");
    fclose($socket);

    if (strpos($sendResponse, "250") !== false) {
        echo json_encode(["success" => true, "message" => "Correo enviado correctamente."]);
    } else {
        echo json_encode(["success" => false, "error" => "Error al enviar datos: " . $sendResponse]);
    }
}

function getResponse($socket, $expectedCode) {
    $response = "";
    while ($line = fgets($socket, 512)) {
        $response .= $line;
        if (substr($line, 3, 1) == " ") {
            break;
        }
    }
    return $response;
}
?>
