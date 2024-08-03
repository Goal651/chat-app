const { doesNotReject } = require('assert');
const { User, Group, GMessage } = require('../models/models');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path')
const { Message } = require('../models/models')


const signup = async (req, res) => {
    let image = ''
    if (req.file) { image = req.file.path; }
    const { email, password, f_name, l_name, username } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User already exists" });
        const newUser = new User({ email, password: hash, image, username, l_name, f_name });
        const savedUser = await newUser.save();
        if (!savedUser) return res.status(500).json({ message: "Failed to save user" });
        res.status(201).json(savedUser);
    } catch (err) {
        res.status(500).json({ message: "Internal server error", error: err.message });
    }
};

const checkUser = (req, res, next) => {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) return res.status(401).json({ message: "Not logged in" });
    jwt.verify(accessToken, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: "Token is not valid" })
        res.status(200).json({ username: user.email, message: "User is authenticated" })
    })
    next()
};

const login = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.sendStatus(404)
        const validated = bcrypt.compareSync(req.body.password, user.password);
        if (!validated) return res.sendStatus(401)
        const accessToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        if (!accessToken) return res.status(500)
        res.status(200).json({ username: user.username, id: user._id, accessToken })
    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
}



const getUsers = async (req, res) => {
    const uploadsDir = path.join(__dirname, '../')
    const { username } = req.query;
    try {
        const users = await User.find().populate({ path: 'unreads.sender', select: 'username' });
        const usersWithDetails = await Promise.all(users.map(async user => {
            let latestMessage = null;
            if (username) latestMessage = await Message.findOne({ $or: [{ sender: user.username, receiver: username }, { sender: username, receiver: user.username }] }).sort({ timestamp: -1 }).exec();
            let imageData = null;
            if (user.image) {
                try {
                    const imagePath = path.join(uploadsDir, user.image);
                    imageData = await fs.readFile(imagePath);
                } catch (err) { console.error('Error reading image file:', err) }
            }
            return { ...user.toObject(), imageData, latestMessage }
        }))
        res.status(200).json({ users: usersWithDetails });
    } catch (err) { res.sendStatus(500) }
}

const getUser = async (req, res) => {
    const uploadsDir = path.join(__dirname, '../');
    try {
        const { username } = req.params
        const user = await User.findOne({ username: username })
        if (!user) return res.status(404).json({ user: null })
        const getUserWithImage = async (user) => {
            if (user.image) {
                try {
                    const imagePath = path.join(uploadsDir, user.image)
                    const imageBuffer = await fs.readFile(imagePath)
                    return { ...user.toObject(), imageData: imageBuffer }
                } catch (err) { return { ...user.toObject(), imageData: null } }
            } else return { ...user.toObject(), imageData: null };
        }
        const userWithImage = await getUserWithImage(user);
        res.status(200).json({ user: userWithImage });
    } catch (err) { res.sendStatus(500) }
}


const updateUser = async (req, res) => {
    const { email } = req.body
    const image = req.file.path
    try {
        const updatedUser = await User.updateOne({ email: email }, { image: image })
        if (!updatedUser) return res.sendStatus(400)
        res.sendStatus(200)
    } catch (err) { res.sendStatus(500) }
}


const createGroup = async (req, res) => {
    const image = req.file.path;
    const { name, admin } = req.body
    try {
        const existingGroup = await Group.findOne({ name })
        if (existingGroup) return res.status(400)
        const newGroup = new Group({ name, admin, image })
        const savedGroup = await newGroup.save()
        if (!savedGroup) return res.status(500)
        res.status(201).json(savedGroup)
    } catch (err) { res.status(500) }
}


const getGroups = async (req, res) => {
    const uploadsDir = path.join(__dirname, '../');
    try {
        const groups = await Group.find();
        const groupsWithImages = await Promise.all(groups.map(async group => {
            let latestMessage = null;
            latestMessage = await GMessage.findOne({ group: group.name }).sort({ timestamp: -1 }).exec();
            let imageData = null
            if (group.image) {
                try {
                    const imagePath = path.join(uploadsDir, group.image);
                    imageData = await fs.readFile(imagePath);
                } catch (err) { res.sendStatus(500) }
            }
            return { ...group.toObject(), imageData, latestMessage }
        }))
        res.status(200).json({ groups: groupsWithImages });
    } catch (err) { res.sendStatus(500) }
}


const getGroup = async (req, res) => {
    const uploadsDir = path.join(__dirname, '../');
    try {
        const { name } = req.params;
        const group = await Group.findOne({ name });
        if (!group) return res.status(404)
        const getGroupWithImage = async (group) => {
            if (group.image) {
                try {
                    const imagePath = path.join(uploadsDir, group.image);
                    const imageBuffer = await fs.readFile(imagePath);
                    return { ...group.toObject(), imageData: imageBuffer };
                } catch (err) { res.sendStatus(500) }
            } else return { ...group.toObject(), imageData: null };
        }
        const groupWithImage = await getGroupWithImage(group);
        res.status(200).json({ group: groupWithImage });
    } catch (err) { res.status(500) }
}


module.exports = {
    signup,
    login,
    checkUser,
    getUsers,
    getUser,
    getGroups,
    getGroup,
    createGroup,
    updateUser
}
