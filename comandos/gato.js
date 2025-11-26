module.exports = {
    nombre: 'gato',
    descripcion: 'Envía una foto aleatoria de un gato.',
    ejecutar: async (sock, remitente) => {
        await sock.sendMessage(remitente, { 
            image: { url: 'https://cataas.com/cat' },
            caption: 'Miau 🐱'
        });
    }
};