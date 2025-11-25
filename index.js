const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal'); // Para mostrar el QR en la terminal
const { procesarMensaje } = require('./logica');
const { iniciarConsola } = require('./consola'); // Importamos el módulo de la consola

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        // printQRInTerminal: true, // Opción obsoleta, la eliminamos
        browser: ["Termux Console", "Chrome", "1.0.0"]
    });

    // Eventos de conexión
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        // Si hay un código QR, lo mostramos en la terminal
        if(qr) {
            qrcode.generate(qr, {small: true});
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Reconectando...', shouldReconnect);
            if (shouldReconnect) connectToWhatsApp();
        } else if (connection === 'open') {
            console.log('\n✅ Bot conectado!');
            // Iniciamos la consola solo cuando el bot está conectado
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
