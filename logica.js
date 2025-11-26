const config = require('./config');
const { GoogleGenerativeAI } = require('@google/generative-ai');


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

    // --- COMANDO 4: GEMINI (Directo desde Node.js) ---
    if (comando.startsWith(`${config.prefix}gemini`)) {
        // Inicializamos el modelo de Gemini con la clave de la configuración
        const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro"});

        // CORRECCIÓN: La forma correcta de extraer la pregunta.
        // Quitamos el prefijo y la palabra "gemini" para obtener el prompt limpio.
        const comandoCompleto = `${config.prefix}gemini`;
        const prompt = texto.substring(comandoCompleto.length).trim();

        if (!prompt) {
            return await sock.sendMessage(remitente, { text: 'Debes escribir una pregunta. Uso: !gemini ¿qué es un agujero negro?' });
        }

        try {
            console.log(`🤖 Enviando prompt a Gemini: "${prompt}"`);
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const textResponse = response.text();
            
            await sock.sendMessage(remitente, { text: textResponse });
        } catch (error) {
            console.error('❌ Error al contactar con Gemini:', error);
            await sock.sendMessage(remitente, { text: '🤖 Hubo un problema al conectar con la IA. Inténtalo de nuevo.' });
        }
    }
}

module.exports = { procesarMensaje };
