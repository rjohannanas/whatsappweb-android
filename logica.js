const config = require('./config');

async function procesarMensaje(sock, m) {
    if (!m.message) return;
    if (m.key.fromMe) return;

    // Obtener el tipo de mensaje y el texto
    const type = Object.keys(m.message)[0];
    const texto = m.message.conversation || m.message[type]?.text;
    
    if (!texto) return;

    const remitente = m.key.remoteJid;
    const comando = texto.trim().toLowerCase(); // Limpiamos espacios y mayúsculas

    console.log(`Mensaje: ${texto} | De: ${remitente}`);

    // --- COMANDO 1: PING (Responde al chat origen) ---
    if (comando === `${config.prefix}ping`) {
        await sock.sendMessage(remitente, { text: '¡Pong! 🏓' });
    }

    // --- COMANDO 2: AVISO (Envía al NUMERO ESPECIFICO) ---
    // Este es el cambio que pediste:
    if (comando === `${config.prefix}aviso`) {
        
        await sock.sendMessage(config.numeroObjetivo, { 
            text: `⚠️ ALERTA: Alguien usó el bot.\n\nUsuario: ${remitente}\nDijo: ${texto}`
        });

        // Opcional: Confirmar al usuario que envió el aviso
        await sock.sendMessage(remitente, { text: '✅ Aviso enviado al administrador.' });
    }

    // --- COMANDO 3: GATO (Modular) ---
    if (comando === `${config.prefix}gato`) {
        await sock.sendMessage(remitente, { 
            image: { url: 'https://cataas.com/cat' },
            caption: 'Miau 🐱'
        });
    }
}

module.exports = { procesarMensaje };
