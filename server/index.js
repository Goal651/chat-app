require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const routes = require('./routes/routes');
const { handlerChat } = require('./controllers/chats');
const fs = require('fs').promises;
const path = require('path');

const app = express();

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors({
    origin: "https://chat-app-silk-one.vercel.app", // Adjust this for production
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],

}));

app.use('/', routes);
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://chat-app-silk-one.vercel.app", // Ensure this matches your client
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connected to database');
        fs.mkdir(path.join(__dirname, './uploads/profiles/'), { recursive: true });
        handlerChat(io);

        // Start listening for incoming requests
        server.listen(3001, () => {
            console.log('Server listening on port 3001');
        });
    })
    .catch((error) => {
        console.log('Database connection error:', error);
    });
