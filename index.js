const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal'); // Para mostrar el QR en la terminal
const readline = require('readline'); // Para leer la entrada del usuario
const { procesarMensaje } = require('./logica');
const fs = require('fs'); // Importamos el módulo File System para borrar la sesión
const { iniciarConsola } = require('./consola'); // Importamos el módulo de la consola

// Hack to suppress verbose logs from dependencies that use console.log directly
const originalConsoleLog = console.log;
console.log = function (...args) {
    // Check if any argument contains the suppression string
    const shouldSuppress = args.some(arg =>
        (typeof arg === 'string' && arg.includes('Closing session')) ||
        (typeof arg === 'object' && arg !== null && arg.toString().includes('Closing session'))
    );
    if (shouldSuppress) return;
    originalConsoleLog.apply(console, args);
};

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false, // Desactivamos la impresión automática del QR
        browser: ["Termux Console", "Chrome", "1.0.0"]
    });

    // Variable para controlar si el código de emparejamiento ya fue solicitado
    let pairingCodeRequested = false;

    // Si no estamos registrados, preguntamos el método de conexión
    if (!sock.authState.creds.registered) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const question = (query) => new Promise((resolve) => rl.question(query, resolve));

        const choice = await question("¿Cómo deseas conectar?\n1. Con código QR\n2. Con código de emparejamiento\nElige una opción: ");

        if (choice.trim() === '2') {
            const phoneNumber = await question("Por favor, ingresa tu número de teléfono (ej: 5211234567890): ");
            const code = await sock.requestPairingCode(phoneNumber.trim());
            console.log(`\nTu código de emparejamiento es: ${code}\n`);
            pairingCodeRequested = true; // Marcamos que se solicitó el código
        }
        // Para la opción '1' (QR), no hacemos nada extra, el evento 'connection.update' lo gestionará.

        rl.close();
    }

    // Eventos de conexión
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // Si hay un código QR, lo mostramos en la terminal
        if (qr) {
            console.log("\nEscanea el siguiente código QR con tu teléfono:");
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const statusCode = (lastDisconnect.error)?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

            // Si se solicitó un código de emparejamiento, no intentamos reconectar inmediatamente.
            // El usuario necesita tiempo para introducir el código. La conexión se abrirá o cerrará definitivamente.
            if (pairingCodeRequested && (statusCode === DisconnectReason.timedOut || !statusCode)) {
                return; // Simplemente salimos para evitar el bucle de reconexión
            }

            // Si el error es 'Logged Out', significa que la sesión es inválida.
            // Borramos la carpeta de sesión y reiniciamos el proceso.
            if (statusCode === DisconnectReason.loggedOut) {
                console.log('❌ Sesión inválida o cerrada desde otro dispositivo. Eliminando credenciales y reiniciando...');
                fs.rmSync('./auth_info_baileys', { recursive: true, force: true });
            }

            if (statusCode === DisconnectReason.connectionClosed || statusCode === DisconnectReason.connectionLost || statusCode === DisconnectReason.timedOut) {
                console.log('Conexión perdida. Reconectando...');
                connectToWhatsApp();
            } else if (shouldReconnect) {
                console.log('Reconectando...', shouldReconnect);
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('\n✅ Bot conectado!');
            // Iniciamos la consola solo cuando el bot está conectado. [1]
            iniciarConsola(sock);
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // Evento de mensajes entrantes (WhatsApp)
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        await procesarMensaje(sock, m);
    });
}

connectToWhatsApp();
