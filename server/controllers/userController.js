const { User } = require('../models/models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validator } = require('../schema/dataModels');
const fs = require('fs');


const signup = async (req, res) => {
    console.log(req.file);
    const image = req.file.path;
    const { username, email, password } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User already exists" });
        const newUser = new User({ username, email, password: hash, image });
        const savedUser = await newUser.save();
        if (!savedUser) return res.status(500).json({ message: "Failed to save user" });
        res.status(201).json(savedUser);
    } catch (err) {
        res.status(500).json({ message: "Internal server error", error: err.message });
    }
};

const checkUser = (req, res) => {
    console.log(req.cookies);
    const accessToken = req.cookies.accessToken;
    if (!accessToken) return res.status(401).json({ message: "Not logged in" });
    jwt.verify(accessToken, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: "Token is not valid" });
        res.status(200).json({ username: user.email, message: "User is authenticated" });
    });
};

const login = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(404).json({ message: "Wrong email!" });
        const validated = await bcrypt.compare(req.body.password, user.password);
        if (!validated) return res.status(401).json({ message: "Wrong credentials!" });
        const accessToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        if (!accessToken) return res.status(500).json({ message: "Failed to generate access token" });
        res.status(200).json(user.username);
    } catch (err) {
        res.status(500).json({ message: "Internal server error", error: err.message });
    }
};

const getUsers = async (req, res) => {
    fs.readdir('./uploads', (err, files) => {
        if (err) return res.status(500).json({ message: 'enable to retrieve files' });
        res.files = files;
    })
    try {
        const users = await User.find();
        res.status(200).json({users, files: res.files});
    } catch (err) {
        res.sendStatus(500);
    }
}

const test = (req, res) => {
    console.log(req.body.image);
    res.status(202).send('Wow finally');
}


module.exports = { signup, login, checkUser, getUsers, test };
