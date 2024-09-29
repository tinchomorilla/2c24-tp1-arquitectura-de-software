import express from 'express';
import axios from 'axios';
import { nanoid } from 'nanoid';
import { rateLimit } from 'express-rate-limit'
import { measureTime } from './utils/metrics.js'

const app = express();
const id = nanoid();

app.use((req, res, next) => {
    res.setHeader('X-API-ID', id);
    next();
});


const limiter = rateLimit({
	windowMs: 45 * 1000, // 15 minutes
	limit: 200, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
	// store: ... , // Redis, Memcached, etc. See below.
})

// Apply the rate limiting middleware to all requests.
app.use(limiter)

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
            console.log(respuesta, error.message);
            res.status(500).json(respuesta);
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
            console.log(respuesta, error.message);
            res.status(500).json(respuesta);
        }   
    })
});

// Endpoint de noticias de vuelos espaciales
app.get("/spaceflight_news", async (req, res) => {
    measureTime('complete_time', async () => {
        const response = await measureTime('external_api_time', async () => {
            return await axios.get('https://api.spaceflightnewsapi.net/v4/articles/?limit=5');
        })

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
    })
});




app.listen(3000);