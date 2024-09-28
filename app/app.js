import express from 'express';
import axios from 'axios';
import { nanoid } from 'nanoid';
import { createClient } from 'redis';
import { measureTime } from './utils/metrics.js'


const app = express();
const id = nanoid();
const redisClient = createClient({ url: 'redis://redis:6379' });

(async () => {
    await redisClient.connect();
})();


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
// En este endpoint no se cachea la response por un tema que es random
// es decir que cada request sera distinta y no tiene sentido guardarlo en la cache
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

app.get('/ping', async (req, res) => {
    measureTime('complete_time', async () => {
        res.status(200).send('pong');
    })
});

// Endpoint de diccionario
app.get('/dictionary', async (req, res) => {
    measureTime('complete_time', async () => {
    const word = req.query.word;
    let response = [];
    try {
        
        // clave es la palabra
        const responseString = await redisClient.get(word);

        if (responseString) {
            console.log("ENTRO AL IF");
            response = JSON.parse(responseString);
        }
        else{
            console.log("ENTRO AL ELSE");
            
            // console.log("ENTRO AL IF");
            const response_api = await measureTime('external_api_time', async () => {
                return await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            })

            // Una palabra puede tener varias definiciones
            // Juntamos todas las foneticas en un array, y todas las definiciones en otro
            let phonetics = [];
            let meanings = [];

            response_api.data.forEach(e => {
                phonetics.push(...e.phonetics);
                meanings.push(...e.meanings);
            });

            response = {phonetics, meanings};

            await redisClient.set(word, JSON.stringify(response), {
                EX: 60,
            });

        }    

        res.status(200).send(response);
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
    let titles = [];

    const titlesString = await redisClient.get('spaceflight_news');

    if (titlesString) {
        titles = JSON.parse(titlesString);
    } else {
        const response = await measureTime('external_api_time', async () => {
            return await axios.get('https://api.spaceflightnewsapi.net/v4/articles/?limit=5');
        })

        if (response.status === 200) {
            response.data.results.forEach(e => {
                if (e.hasOwnProperty('title')) {
                    titles.push(e.title);
                }
            });
            await redisClient.set('spaceflight_news', JSON.stringify(titles), {
                EX: 60,
            });
        } else {
            res.status(response.status).send(response.statusText);
        }
    }
    
    res.status(200).send(titles);
    })

});


app.listen(3000);