import express from 'express';
import axios from 'axios';
import { nanoid } from 'nanoid';

const app = express();
const id = nanoid();

app.use((req, res, next) => {
    res.setHeader('X-API-ID', id);
    next();
});

app.get('/', async (req, res) => {
    res.status(200).send('ping');
});

// Endpoint de healthcheck
app.get('/ping', async (req, res) => {
    res.status(200).send('pong');
});

// Endpoint de diccionario
app.get('/dictionary', async (req, res) => {
    const word = req.query.word;
    try {
        //si no es un 200 axios tira una excepcion
        const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);

        // Una palabra puede tener varias definiciones
        // Juntamos todas las foneticas en un array, y todas las definiciones en otro
        let phonetics = [];
        let meanings = [];

        response.data.forEach(e => {
            phonetics.push(...e.phonetics);
            meanings.push(...e.meanings);
        });

        res.status(200).send({ phonetics, meanings });
    } catch (error) {
        let respuesta = { error: "Error al obtener la palabra del diccionario." };
        console.log(respuesta, error.message);
        res.status(500).json(respuesta);
    }
});

// Endpoint de noticias de vuelos espaciales
app.get("/spaceflight_news", async (req, res) => {
    const response = await axios.get('https://api.spaceflightnewsapi.net/v4/articles/?limit=5');
    let titles = [];

    if (response.status === 200) {
        response.data.results.forEach(e => {
            if (e.hasOwnProperty('title')) {
                titles.push(e.title);
            }
        });

        res.status(200).send(titles);
    } else {
        res.status(response.status).send(response.statusText);
    }

});



app.listen(3000);