require('dotenv').config();
const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const routes = require('./routes/routes');
const { handlerChat } = require('./controllers/chats');


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());
app.use('/', routes);


const server = http.createServer(app);
const io = new Server(server, {
    cors: {
         origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
})

handlerChat(io);

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connected to database');
        server.listen(3001, () => {
            console.log('listening on *:3001');
        });
    })
    .catch((error) => {
        console.log(error);
    });
