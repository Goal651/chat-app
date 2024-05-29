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
const Grid = require('gridfs-stream');
const { handlerChat } = require('./controllers/chatController');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const path = require('path');


// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors({ credentials: true, origin: "http://localhost:5173" })); // Ensure origin matches your frontend
app.use('/', routes);




const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Initialize chat handler
handlerChat(io);

// Database connection
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
const conn = mongoose.connection;
let gfs;
conn.once('open', () => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');



    const storage = new GridFsStorage({
        url: process.env.MONGO_URI,
        file: (req, file) => {
            return {
                filename: file.originalname,
                bucketName: 'uploads'
            }
        }
    })

    const upload = multer({ storage });

    app.post('/test1', upload.single('file'), (req, res) => {
        res.json({ file: req.file })
    })
})