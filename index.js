const express = require('express');
const { Configuration, OpenAIApi } = require('openai');
const twilio = require('twilio');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Configuración de OpenAI
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Ruta para recibir la llamada de Twilio
app.post('/voice', (req, res) => {
    const twiml = new twilio.twiml.VoiceResponse();

    // Mensaje de bienvenida
    twiml.say('Hola, bienvenido al bot automatizado. Por favor, dime qué necesitas.');

    // Graba la respuesta del usuario
    twiml.record({
        action: '/handle-recording',
        transcribe: true,
        transcribeCallback: '/handle-transcription',
        maxLength: 30,  // Limita el tiempo de grabación
    });

    res.type('text/xml');
    res.send(twiml.toString());
});

// Ruta para manejar la transcripción de la grabación
app.post('/handle-transcription', async (req, res) => {
    const transcription = req.body.TranscriptionText;

    // Llamada a OpenAI para generar una respuesta
    const gptResponse = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt: `Respond in Spanish: ${transcription}`,
        max_tokens: 150,
    });

    const responseText = gptResponse.data.choices[0].text.trim();

    // Respuesta de Twilio con la respuesta de ChatGPT
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say(responseText);

    res.type('text/xml');
    res.send(twiml.toString());
});

// Iniciar el servidor
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
});
