const { User, Profile } = require('../models/models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validator } = require('../schema/dataModels');
const multer = require('multer');
const upload=multer({dest: 'uploads/'})


const signup = async (req, res) => {
    const { error, value } = validator(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    const { username, email, password } = value;
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User already exists" });
        const newUser = new User({ username, email, password: hash });
        const savedUser = await newUser.save();
        if (!savedUser) return res.status(500).json({ message: "Failed to save user" });
        const newImage = new Profile({ data: req.file.buffer, contentType: req.file.mimetype });
        const savedImage = await newImage.save();
        if (!savedImage) return res.status(500).json({ message: "Failed to save image" });
        
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
        if (!user) return res.status(401).json({ message: "Wrong email!" });
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
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (err) {
        res.sendStatus(500);
    }
}


module.exports = { signup, login, checkUser, getUsers };
