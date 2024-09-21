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