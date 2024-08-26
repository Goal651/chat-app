const path = require('path');
const fs = require('fs').promises;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Group, GMessage, Message } = require('../models/models');
const { readFile } = require('fs');

const uploadsDir = path.join(__dirname, '../');

// User Signup
const signup = async (req, res) => {
    try {
        const { email, password, names, username } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.sendStatus(400);

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        let image = '';
        if (req.file) image = req.file.path;

        const newUser = new User({ email, password: hash, image, username, names });
        const savedUser = await newUser.save();
        if (!savedUser) return res.sendStatus(500);

        res.status(201).json(savedUser);
    } catch (err) {
        res.sendStatus(500);
    }
};

// User Login
const login = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.sendStatus(404);

        const validated = bcrypt.compareSync(req.body.password, user.password);
        if (!validated) return res.sendStatus(401);

        const accessToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        if (!accessToken) return res.sendStatus(500);

        res.status(200).json({ accessToken, email: user.email });
    } catch (err) {
        res.sendStatus(500);
    }
};

// Fetch All Users Except Logged-in User
const getUsers = async (req, res) => {
    try {
        const email = req.user;
        const users = await User.find({ email: { $ne: email } });

        const usersWithDetails = await Promise.all(users.map(async (user) => {
            let latestMessage = await Message.findOne({
                $or: [{ sender: user.email, receiver: email }, { sender: email, receiver: user.email }]
            }).sort({ timestamp: -1 }).exec();

            let imageData = "";
            if (user.image) {
                try {
                    const imagePath = path.join(uploadsDir, user.image);
                    const data = await fs.readFile(imagePath);
                    imageData = data.toString('base64');
                } catch (err) {
                    console.error(`Error reading image for user ${user.email}:`, err);
                }
            }

            return { ...user.toObject(), imageData, latestMessage };
        }));

        res.status(200).json({ users: usersWithDetails });
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
};

// Fetch Logged-in User's Profile
const getUserProfile = async (req, res) => {
    try {
        const email = req.user;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ user: null });

        const imageData = user.image ? await readImage(user.image) : null;
        res.status(200).json({ user: { ...user.toObject(), imageData } });
    } catch (err) {
        res.sendStatus(500);
    }
};

// Fetch a Specific User by Email
const getUser = async (req, res) => {
    try {
        const { email } = req.params;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ user: null });
        const imageData = user.image ? await readImage(user.image) : null;
        res.status(200).json({ user: { ...user.toObject(), imageData } });
    } catch (err) {
        res.sendStatus(500);
    }
};

// Update User Profile
const updateUser = async (req, res) => {
    try {
        const email = req.user;
        const image = req.file.path;
        const updatedUser = await User.updateOne({ email }, { image });
        if (!updatedUser) return res.sendStatus(400);
        res.status(201).json({});
    } catch (err) {
        res.sendStatus(500);
    }
};
const createGroup = async (req, res) => {
    try {
        const { name } = req.body;
        const admin = req.user;
        const existingGroup = await Group.findOne({ name });
        if (existingGroup) return res.sendStatus(400);
        let image = '';
        if (req.file) image = req.file.path;
        const newGroup = new Group({ name, admin, image, members: [{ email: admin, role: 'admin' }] });
        const savedGroup = await newGroup.save();
        if (!savedGroup) return res.sendStatus(500);
        await User.updateOne({ email: admin }, { $push: { groups: name } });
        res.status(201).json(savedGroup);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
};


// Fetch All Groups
const getGroups = async (req, res) => {
    try {
        const userEmail = req.user;
        const groups = await Group.find({ "members.email": userEmail });
        const groupsWithImages = await Promise.all(groups.map(async (group) => {
            let latestMessage = await GMessage.findOne({ group: group.name }).sort({ timestamp: -1 }).exec();
            const imageData = group.image ? await readImage(group.image) : null;
            return { ...group.toObject(), imageData, latestMessage };
        }));
        res.status(200).json({ groups: groupsWithImages });
    } catch (err) {
        res.sendStatus(500);
    }
};


// Fetch a Specific Group by Name
const getGroup = async (req, res) => {
    try {
        const { name } = req.params;
        const group = await Group.findOne({ name });
        if (!group) return res.status(404).json({ group: null });

        const members = await Promise.all(group.members.map(async (member) => {
            const user = await User.findOne({ email: member.email });
            if (!user) return null; // Handle the case where the user is not found
            return { ...user.toObject(), role: member.role };
        }));

        const memberImages = await Promise.all(members.map(async (user) => {
            if (!user) return null; // Skip processing if the user is not found
            let imageData = "";
            if (user.image) {
                try {
                    imageData = await readImage(user.image);
                } catch (err) {
                    console.error(`Error reading image for user ${user.email}:`, err);
                }
            }
            return { ...user, imageData };
        }));

        const groupImageData = group.image ? await readImage(group.image) : null;

        res.status(200).json({
            group: {
                ...group.toObject(),
                imageData: groupImageData,
                members: memberImages.filter(user => user !== null) // Filter out any null values
            }
        });

    } catch (err) {
        console.error('Error fetching group data:', err);
        res.sendStatus(500);
    }
};

const readImage = async (imagePath) => {
    try {
        const fullPath = path.join(uploadsDir, imagePath);
        const imageBuffer = await fs.readFile(fullPath);
        return imageBuffer.toString('base64');
    } catch (err) {
        console.error('Error reading image:', err);
        return null;
    }
};

const addMember = async (req, res) => {
    try {
        const { groupName, memberEmail } = req.body;
        const adminEmail = req.user;
        const group = await Group.findOne({ name: groupName });
        if (!group) return res.status(404).json({ message: 'Group not found' });
        const user = await User.findOne({ email: memberEmail });
        if (!user) return res.status(404).json({ message: 'User not found' });
        const isMember = group.members.some(member => member.email === memberEmail);
        if (isMember) return res.status(400).json({ message: 'User is already a member' });
        group.members.push({ email: memberEmail });
        await group.save();
        user.groups.push(groupName);
        await user.save();
        res.status(200).json({ message: 'Member added successfully' })
    } catch (err) {
        console.error('Error adding member:', err);
        res.status(500).json({ message: 'Server error' });
    }
};



module.exports = {
    signup,
    login,
    getUsers,
    getUser,
    getGroups,
    getGroup,
    getUserProfile,
    createGroup,
    updateUser,
    addMember
};
