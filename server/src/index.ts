require('dotenv').config();
import express from 'express'
import http from 'http'
import mongoose from 'mongoose'
import { Server } from 'socket.io'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import cors from 'cors'
import routes from './routes/routes'


const app = express();

// Middleware setup

app.use(cors({
    origin: ["https://chat-app-silk-one.vercel.app", "http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],

}));
app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));
app.use(bodyParser.json({ limit: '5mb' }));
app.use(cookieParser());
app.use('/api',routes);


const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["https://chat-app-silk-one.vercel.app", "http://localhost:5173"], // Ensure this matches your client
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

// Connect to MongoDB
mongoose.connect(process.env.test_uri as string)
    .then(async () => {
        server.listen(3001, () => console.log('Server is running on port 3001'));
    })
    .catch(err => console.log(err));
