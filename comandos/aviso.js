const config = require('../config');

module.exports = {
    nombre: 'aviso',
    descripcion: 'Envía un aviso al número de administrador.',
    ejecutar: async (sock, remitente, texto) => {
        await sock.sendMessage(config.numeroObjetivo, { 
            text: `⚠️ ALERTA: Alguien usó el bot.\n\nUsuario: ${remitente}\nDijo: ${texto}`
        });
        await sock.sendMessage(remitente, { text: '✅ Aviso enviado al administrador.' });
    }
};