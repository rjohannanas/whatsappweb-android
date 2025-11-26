module.exports = {
    nombre: 'ping',
    descripcion: 'Responde con Pong para verificar si el bot está activo.',
    ejecutar: async (sock, remitente) => {
        await sock.sendMessage(remitente, { text: '¡Pong! 🏓' });
    }
};