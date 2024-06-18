const { User } = require('../models/models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validator } = require('../schema/dataModels');
const fs = require('fs').promises;
const path = require('path')


const signup = async (req, res) => {
    const uploadsDir = path.join(__dirname, '../uploads');

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
    const uploadsDir = path.join(__dirname, '../');
    try {
        const users = await User.find();
        const usersWithImages = await Promise.all(users.map(async user => {
            if (user.image) {
                try {
                    const imagePath = path.join(uploadsDir, user.image);
                    const imageBuffer = await fs.readFile(imagePath);
                    return { ...user.toObject(), imageData: imageBuffer };
                } catch (err) { return { ...user.toObject(), imageData: null } }
            } else return { ...user.toObject(), imageData: null };
        }));
        res.status(200).json({ users: usersWithImages });
    } catch (err) { res.sendStatus(500); }
};

const getUser=async (req,res)=>{
    const {id}=req.params
    const user=await User.findById(id)
    if(!user) return res.status(404).json({message:"User not found"});
    res.status(200).json({userImage:user.image})
}




const test = (req, res) => {
    fs.readdir(uploadsDir, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return res.status(500).json({ error: 'Error reading directory' });
        }

        const fileData = files.map((file) => {
            const filePath = path.join(uploadsDir, file);
            const fileBuffer = fs.readFileSync(filePath);
            return { data: fileBuffer };
        });

        res.json(fileData);
    });
}


module.exports = { signup, login, checkUser, getUsers,getUser, test };
