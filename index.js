import express from 'express';
import OpenAI from 'openai';
import twilio from 'twilio';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


// Configuración de OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, 
});


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
    try {
        
        const transcription = req.body.TranscriptionText;
        const gptResponse = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{
                content: `Respond in Spanish: ${transcription}`,
                role: "user"
            }],
            max_tokens: 150
        });

        const responseText = gptResponse.choices[0].message.content;

        // Respuesta de Twilio con la respuesta de ChatGPT
        const twiml = new twilio.twiml.VoiceResponse();
        twiml.say(responseText);
        res.type('text/xml');
        res.send(twiml.toString());

    } catch (error) {
        console.error('Error al procesar la transcripción:', error);
        res.status(500).send('Error al procesar la transcripción');
    }


});

// Iniciar el servidor
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
});
