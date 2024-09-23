require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
const routes = require('./routes/routes');
const { handlerChat } = require('./controllers/chats');

const app = express();

// Middleware setup
app.use(express.json());
app.use(cors());
app.use('/', routes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to database'))
    .catch(err => console.error(err));

// Export a function for Vercel
module.exports = (req, res) => {
    // Handle incoming requests
    app(req, res);

    // Socket.io setup
    const server = require('http').createServer(app);
    const io = new Server(server, {
        cors: {
            origin: "http://localhost:5173", // Replace with your front-end URL in production
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Set up chat handler
    handlerChat(io);

    // Start listening for connections
    server.listen(process.env.PORT || 3001, () => {
        console.log(`Listening on port ${process.env.PORT || 3001}`);
    });
};
