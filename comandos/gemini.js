const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config');

module.exports = {
    nombre: 'gemini',
    descripcion: 'Realiza una consulta al modelo de IA Gemini.',
    ejecutar: async (sock, remitente, texto, args) => {
        const prompt = args.join(' ');

        if (!prompt) {
            return await sock.sendMessage(remitente, { text: 'Debes escribir una pregunta. Uso: !gemini ¿qué es un agujero negro?' });
        }

        try {
            await sock.sendPresenceUpdate('composing', remitente);

            const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
};