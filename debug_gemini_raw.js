const config = require('./config');

async function testRaw() {
    const apiKey = config.GEMINI_API_KEY;
    const model = 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    console.log(`Testing URL: https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=HIDDEN`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: "Hello" }]
                }]
            })
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log('Response Body:', text);

    } catch (error) {
        console.error('Fetch Error:', error);
    }
}

testRaw();
