const config = require('./config');
const fs = require('fs');
const path = require('path');

// --- CARGADOR DINÁMICO DE COMANDOS ---
// Crea una colección para almacenar todos los comandos.
const comandos = new Map();
const rutaComandos = path.join(__dirname, 'comandos');
const archivosComandos = fs.readdirSync(rutaComandos).filter(file => file.endsWith('.js'));

for (const archivo of archivosComandos) {
    const comando = require(path.join(rutaComandos, archivo));
    // Usa el nombre del comando (ej: 'ping') como clave en la colección.
    comandos.set(comando.nombre, comando);
}
// --- FIN DEL CARGADOR ---

async function procesarMensaje(sock, m) {
    if (!m.message) return;
    if (m.key.fromMe) return;

    const texto = m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.imageMessage?.caption || m.message?.videoMessage?.caption;
    if (!texto) return;

    // Verifica si el mensaje es un comando basado en el prefijo.
    if (!texto.startsWith(config.prefix)) return;

    const remitente = m.key.remoteJid;
    console.log(`Comando recibido: ${texto} | De: ${remitente}`);

    // Extrae el nombre del comando y los argumentos del texto.
    const args = texto.slice(config.prefix.length).trim().split(/ +/);
    const nombreComando = args.shift().toLowerCase();

    // Busca el comando en la colección que cargamos al inicio.
    const comando = comandos.get(nombreComando);

    // Si el comando no existe, no hace nada.
    if (!comando) return;

    try {
        // Ejecuta el comando correspondiente pasándole los parámetros necesarios.
        await comando.ejecutar(sock, remitente, texto, args);
    } catch (error) {
        console.error(`❌ Error ejecutando el comando '${nombreComando}':`, error);
        await sock.sendMessage(remitente, { text: `❌ Ocurrió un error al intentar ejecutar ese comando.` });
    }
}

module.exports = { procesarMensaje };
