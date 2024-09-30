import express from 'express';
import axios from 'axios';
import { nanoid } from 'nanoid';
import { measureTime } from './utils/metrics.js'

const app = express();
const id = nanoid();

app.use((req, res, next) => {
    res.setHeader('X-API-ID', id);
    next();
});

app.get('/', async (req, res) => {
    measureTime('complete_time', async () => {
        res.status(200).send('ping');
    })
});


// Endpoint uselessfacts
app.get('/facts', async (req, res) => {
    measureTime('complete_time', async () => {
        try {
            const response = await measureTime('external_api_time', async () => {
                return await axios.get('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en');
            })
            const data = response.data;
            const factText = data.text;
            res.status(200).send(factText);
        } catch (error) {
            let respuesta = { error: "Error al obtener el texto en uselessfacts" };
            let status = error.response ? error.response.status : 500;
            console.log(respuesta, error.message);
            res.status(status).json(respuesta);
        }
    })
});


// Endpoint de healthcheck
app.get('/ping', async (req, res) => {
    measureTime('complete_time', async () => {
        res.status(200).send('pong');
    })
});

// Endpoint de diccionario
app.get('/dictionary', async (req, res) => {
    measureTime('complete_time', async () => {
        const word = req.query.word;
        try {
            //si no es un 200 axios tira una excepcion
            const response = await measureTime('external_api_time', async () => {
                return await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            })

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
            let status = error.response ? error.response.status : 500;
            console.log(respuesta, error.message);
            res.status(status).json(respuesta);
        }
    })
});

// Endpoint de noticias de vuelos espaciales
app.get("/spaceflight_news", async (req, res) => {
    measureTime('complete_time', async () => {
        try {
            const data = await measureTime('external_api_time', async () => {
                const aux = await axios.get('https://api.spaceflightnewsapi.net/v4/articles/?limit=5');

                // Verificar el código de estado HTTP
                if (aux.status < 200 || aux.status >= 300) {
                    throw new HttpError("No se pudieron obtener las ultimas noticias", aux.status);
                }

                return aux.data;
            })

            let titles = [];

            data.results.forEach(e => {
                if (e.hasOwnProperty('title')) {
                    titles.push(e.title);
                }
            });

            res.status(200).json(titles);
        } catch (error) {
            let status = error.response ? error.response.status : 500;
            let mensaje = error.message || "Error al obtener las noticias de vuelos espaciales.";
            console.error(mensaje);
            res.status(status).json({ error: mensaje });
        }
    })
});


app.listen(3000);