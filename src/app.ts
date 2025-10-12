import apicache from 'apicache';
import bodyParser from 'body-parser';
import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';

dotenv.config();

import * as ctaBusController from './controllers/ctaBusController';
import * as ctaTrainController from './controllers/ctaTrainController';
import * as eventsController from './controllers/eventsController';
import * as homeController from './controllers/homeController';
import * as messagesController from './controllers/messagesController';
import * as weatherController from './controllers/weatherController';

const app = express();

const cache = apicache.middleware;

app.set('port', process.env.PORT || 8080);
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'pug');
app.use(cors());
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public'), { maxAge: 0 }));
app.use('/api/*', cache('1 minute'));

app.get('/', homeController.index);
app.get('/config', homeController.config);
app.get('/offline', homeController.offline);
app.get('/demo', homeController.demo);
app.get('/api/ctaBus', ctaBusController.ctaBus);
app.get('/api/ctaTrain', ctaTrainController.ctaTrain);
app.get('/api/weather', weatherController.weather);
app.get('/api/events', eventsController.events);
app.get('/api/messages', messagesController.messages);

export default app;
