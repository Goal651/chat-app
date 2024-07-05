const { User, Group } = require('../models/models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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



const getUser = async (req, res) => {
    const uploadsDir = path.join(__dirname, '../');
    try {
        const { userEmail } = req.params;
        const user = await User.findOne({ username: userEmail })
        if (!user) return res.status(404).json({ error: 'User not found' })
        const getUserWithImage = async (user) => {
            if (user.image) {
                try {
                    const imagePath = path.join(uploadsDir, user.image)
                    const imageBuffer = await fs.readFile(imagePath)
                    return { ...user.toObject(), imageData: imageBuffer }
                } catch (err) {
                    return { ...user.toObject(), imageData: null }
                }
            } else return { ...user.toObject(), imageData: null };

        }
        const userWithImage = await getUserWithImage(user);
        res.status(200).json({ user: userWithImage });
    } catch (err) {
        console.error('Error fetching user:', err);
        res.sendStatus(500);
    }
}



const createGroup = async (req, res) => {
    const image = req.file.path;
    const { name, admin } = req.body
    try {
        const existingGroup = await Group.findOne({ name })
        if (existingGroup) return res.status(400).json({ message: "User already exists" });
        const newGroup = new Group({ name, admin, image })
        const savedGroup = await newGroup.save()
        if (!savedGroup) return res.status(500).json({ message: "Failed to save user" });
        res.status(201).json(savedGroup)
    } catch (err) {
        res.status(500).json({ message: "Internal server error", error: err.message });
    }
};


const getGroups = async (req, res) => {
    const uploadsDir = path.join(__dirname, '../');
    try {
        const groups = await Group.find();
        const groupsWithImages = await Promise.all(groups.map(async group => {
            if (group.image) {
                try {
                    const imagePath = path.join(uploadsDir, group.image);
                    const imageBuffer = await fs.readFile(imagePath);
                    return { ...group.toObject(), imageData: imageBuffer };
                } catch (err) { return { ...group.toObject(), imageData: null } }
            } else return { ...group.toObject(), imageData: null };
        }));
        res.status(200).json({ groups: groupsWithImages });
    } catch (err) { res.sendStatus(500); }
}


const getGroup = async (req, res) => {
    const uploadsDir = path.join(__dirname, '../');
    try {
        const { name } = req.params;
        const group = await Group.findOne({ name });
        if (!group) return res.status(404).json({ error: 'User not found' });
        const getGroupWithImage = async (group) => {
            if (group.image) {
                try {
                    const imagePath = path.join(uploadsDir, group.image);
                    const imageBuffer = await fs.readFile(imagePath);
                    return { ...group.toObject(), imageData: imageBuffer };
                } catch (err) {
                    return { ...group.toObject(), imageData: null };
                }
            } else return { ...group.toObject(), imageData: null };
        }
        const groupWithImage = await getGroupWithImage(group);
        res.status(200).json({ group: groupWithImage });
    } catch (err) {
        console.error('Error fetching group:', err);
        res.sendStatus(500);
    }
}


module.exports = {
    signup,
    login,
    checkUser,
    getUsers,
    getUser,
    getGroups,
    getGroup,
    createGroup
}
