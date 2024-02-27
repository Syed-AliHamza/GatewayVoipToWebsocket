import express from 'express';
import bodyParser from 'body-parser';
import session from 'express-session';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import 'dotenv/config';
import apiSpec from '../openapi.json';
import './config/passport';
import routes from './routes';
import handleErrors from './middlewares/errorHandler';

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    cookie: { maxAge: 60000 },
    resave: false,
    saveUninitialized: false,
  })
);

app.use('/assets', express.static('public/uploads'));
app.use('/api', routes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(apiSpec));
app.use(handleErrors);

export default app;
