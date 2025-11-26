const config = require('./config');

async function listModels() {
    const apiKey = config.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    console.log(`Testing URL: https://generativelanguage.googleapis.com/v1beta/models?key=HIDDEN`);

    try {
        const response = await fetch(url);
        console.log(`Status: ${response.status} ${response.statusText}`);

        const data = await response.json();
        if (data.models) {
            console.log('✅ Available Models:');
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
                    console.log(`- ${m.name}`);
                }
            });
        } else {
            console.log('Response Body:', JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error('Fetch Error:', error);
    }
}

listModels();
