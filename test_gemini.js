const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('./config');

async function testGemini() {
    console.log('Testing Gemini connection...');
    console.log(`API Key: ${config.GEMINI_API_KEY ? 'Present' : 'Missing'}`);

    const models = ["gemini-pro", "gemini-1.0-pro", "gemini-1.5-flash"];
    const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);

    for (const modelName of models) {
        console.log(`\n--- Testing model: ${modelName} ---`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });

            const prompt = "Hello";
            console.log(`Sending prompt: "${prompt}"`);

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            console.log(`✅ Success with ${modelName}! Response:`, text);
            return; // Stop after first success
        } catch (error) {
            console.error(`❌ Failed with ${modelName}:`, JSON.stringify(error, null, 2));
        }
    }
    console.log('\n❌ All models failed.');
}

testGemini();
