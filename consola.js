const readline = require('readline');

function iniciarConsola(sock) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    // Muestra el menú de comandos una vez que el bot está listo
    console.log('--- COMANDOS DE CONSOLA ---');
    console.log('1. Texto:  enviar [numero] [mensaje]');
    console.log('2. Foto:   gato [numero]');
    console.log('3. Salir:  salir');
    console.log('---------------------------\n');

    rl.on('line', async (line) => {
        const args = line.split(' ');
        const comando = args[0].toLowerCase();

        if (comando === 'salir') {
            console.log('Cerrando bot...');
            // await sock.logout(); // Cierra la sesión de WhatsApp (Eliminado para mantener sesión)
            process.exit(0);
        }

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

        if (comando === 'gato') {
            const numero = args[1];
            if (!numero) return console.log('❌ Uso: gato 51999...');
            const idDestino = numero.includes('@s.whatsapp.net') ? numero : `${numero}@s.whatsapp.net`;

            console.log('⏳ Enviando michi...');
            await sock.sendMessage(idDestino, { image: { url: 'https://cataas.com/cat' }, caption: 'Acá tienes un gato 😺' });
            console.log(`✅ Foto enviada a ${numero}`);
        }
    });
}

module.exports = { iniciarConsola };