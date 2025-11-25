const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const readline = require('readline'); // Importamos la librería de lectura
const { procesarMensaje } = require('./logica');

// 1. Aquí definimos qué es 'rl' (la interfaz de consola)
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }),
        browser: ["Termux Console", "Chrome", "1.0.0"]
    });

    // Eventos de conexión
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Reconectando...', shouldReconnect);
            if (shouldReconnect) connectToWhatsApp();
        } else if (connection === 'open') {
            console.log('\n✅ Bot conectado!');
            console.log('--- COMANDOS DE CONSOLA ---');
            console.log('1. Texto:  enviar [numero] [mensaje]');
            console.log('2. Foto:   gato [numero]');
            console.log('3. Salir:  salir');
            console.log('---------------------------\n');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // Evento de mensajes entrantes (WhatsApp)
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        await procesarMensaje(sock, m);
    });

    // --- LÓGICA DE LA CONSOLA (Terminal Termux) ---
    // Esto debe estar AQUÍ DENTRO para que 'sock' exista
    rl.on('line', async (line) => {
        const args = line.split(' ');
        const comando = args[0].toLowerCase();

        // COMANDO: SALIR
        if (comando === 'salir') {
            console.log('Cerrando bot...');
            process.exit(0);
        }

        // COMANDO: ENVIAR (Texto)
        if (comando === 'enviar') {
            const numero = args[1]; 
            const texto = args.slice(2).join(' '); 

            if (!numero || !texto) return console.log('❌ Uso: enviar 51999... Hola mundo');

            const idDestino = numero.includes('@s.whatsapp.net') ? numero : `${numero}@s.whatsapp.net`;

            try {
                await sock.sendMessage(idDestino, { text: texto });
                console.log(`✅ Texto enviado a ${numero}`);
            } catch (e) {
                console.log('❌ Error enviando:', e);
            }
        }

        // COMANDO: GATO (Foto)
        if (comando === 'gato') {
            const numero = args[1]; // Solo necesitamos el número

            if (!numero) return console.log('❌ Uso: gato 51999...');

            const idDestino = numero.includes('@s.whatsapp.net') ? numero : `${numero}@s.whatsapp.net`;

            console.log('⏳ Enviando michi...');
            try {
                await sock.sendMessage(idDestino, { 
                    image: { url: 'https://cataas.com/cat' }, 
                    caption: 'Acá tienes un gato 😺' 
                });
                console.log(`✅ Foto enviada a ${numero}`);
            } catch (e) {
                console.log('❌ Error al enviar imagen:', e);
            }
        }
    });
}

connectToWhatsApp();
