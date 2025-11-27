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

    // Variable para rastrear el estado de conexión
    let isConnected = false;
    let lastQR = null;
    let isCheckingSession = true;

    // Eventos de conexión (Definimos esto ANTES de preguntar, para detectar si se conecta solo)
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            lastQR = qr;
        }

        // Si hay un código QR, lo mostramos en la terminal SOLO si no estamos verificando ni preguntando
        if (qr && !isConnected && !isCheckingSession && !global.rlPrompt) {
            console.log("\nEscanea el siguiente código QR con tu teléfono:");
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            isConnected = false;
            const statusCode = (lastDisconnect.error)?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

            // Si se solicitó un código de emparejamiento, no intentamos reconectar inmediatamente.
            if (pairingCodeRequested && (statusCode === DisconnectReason.timedOut || !statusCode)) {
                return;
            }

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
            isConnected = true;
            isCheckingSession = false; // Ya conectó, no estamos verificando

            // Si estábamos esperando input del usuario, cerramos la interfaz para liberar la consola
            if (global.rlPrompt) {
                global.rlPrompt.close();
                global.rlPrompt = null;
            }
            // Iniciamos la consola solo cuando el bot está conectado.
            iniciarConsola(sock);
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // Evento de mensajes entrantes (WhatsApp)
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        await procesarMensaje(sock, m);
    });

    // Variable para controlar si el código de emparejamiento ya fue solicitado
    let pairingCodeRequested = false;

    // Si no estamos registrados, preguntamos el método de conexión
    // Usamos global.rlPrompt para poder cerrarlo desde el evento 'open' si se conecta solo
    if (!sock.authState.creds.registered) {

        // Pequeña espera para ver si se conecta automáticamente con credenciales cacheadas
        // Esto evita mostrar el menú si la sesión es válida pero 'registered' aparece como false temporalmente
        console.log("⏳ Verificando sesión existente...");
        await new Promise(resolve => setTimeout(resolve, 3000));
        isCheckingSession = false; // Terminó la verificación inicial

        if (!isConnected) {
            console.log(`[Debug] No se detectó conexión automática. Iniciando asistente...`);

            global.rlPrompt = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const question = (query) => new Promise((resolve) => {
                // Si ya se cerró (porque se conectó mientras esperábamos), resolvemos inmediato
                if (!global.rlPrompt) return resolve('');

                global.rlPrompt.question(query, resolve);
                // Si se cierra la interfaz (por conexión exitosa), resolvemos para desbloquear el await
                global.rlPrompt.on('close', () => resolve(''));
            });

            const choice = await question("¿Cómo deseas conectar?\n1. Con código QR\n2. Con código de emparejamiento\nElige una opción: ");

            // Cerramos el prompt manual para liberar el bloqueo de impresión de QR
            if (global.rlPrompt) {
                global.rlPrompt.close();
                global.rlPrompt = null;
            }

            if (choice && choice.trim() === '1') {
                console.log("\nOpción 1 seleccionada: Código QR.");
                if (lastQR) {
                    console.log("Mostrando último QR recibido:");
                    qrcode.generate(lastQR, { small: true });
                } else {
                    console.log("Esperando código QR...");
                }
            } else if (choice && choice.trim() === '2') {
                // Reabrimos interfaz solo para el número
                global.rlPrompt = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                const question2 = (query) => new Promise((resolve) => global.rlPrompt.question(query, resolve));

                const phoneNumber = await question2("Por favor, ingresa tu número de teléfono (ej: 5211234567890): ");
                if (phoneNumber) {
                    const code = await sock.requestPairingCode(phoneNumber.trim());
                    console.log(`\nTu código de emparejamiento es: ${code}\n`);
                    pairingCodeRequested = true;
                }
                global.rlPrompt.close();
                global.rlPrompt = null;
            }
        }
    }
}

connectToWhatsApp();
