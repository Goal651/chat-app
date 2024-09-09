const path = require('path');
const fs = require('fs').promises;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Group, GMessage, Message } = require('../models/models');
const uploadsDir = path.join(__dirname, '../');
const crypto = require('crypto');

const generateKeyPair = async () => {
    return new Promise((resolve, reject) => {
        crypto.generateKeyPair('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem',
                cipher: 'aes-256-cbc',
                passphrase: process.env.KEY.PASSPHRASE // Ensure to use a secure passphrase
            }
        }, (err, publicKey, privateKey) => {
            if (err) return reject(err);
            resolve({ publicKey, privateKey });
        });
    });
}

const decryptPrivateKey = async (encryptedPrivateKey) => {
    try {
        const keyObject = crypto.createPrivateKey({
            key: encryptedPrivateKey,
            format: 'pem',
            passphrase: process.env.KEY.PASSPHRASE
        });
        return keyObject.export({ type: 'pkcs1', format: 'pem' });
    } catch (err) {
        console.error('Error decrypting private key:', err);
        throw err;
    }
};

// Function to decrypt messages
const decryptMessage = async (privateKey, encryptedMessage) => {
    try {
        return crypto.privateDecrypt(
            {
                key: privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
            },
            Buffer.from(encryptedMessage, 'base64')
        ).toString('utf-8');
    } catch (err) {
        console.error('Error decrypting message:', err);
        throw err;
    }
};

const getPrivateKeyFromConfig = async (email) => {
    try {
        const configPath = path.join(__dirname, '../config.json');
        const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
        return config[`${email}`];
    } catch (error) {
        console.error('Error reading private key from config:', error);
        throw error;
    }
};


const signup = async (req, res) => {
    try {
        const { email, password, names, username } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.sendStatus(400);
        const { publicKey, privateKey } = await generateKeyPair();
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        let image = '';
        if (req.file) image = req.file.path;
        const newUser = new User({
            email,
            password: hash,
            image,
            username,
            names,
            publicKey
        });
        const savedUser = await newUser.save();
        if (!savedUser) return res.sendStatus(500);
        const privateKeyPath = path.join(__dirname, '../config.json');
        let existingKeys = {};
        try {
            const fileContent = await fs.readFile(privateKeyPath, 'utf8');
            existingKeys = JSON.parse(fileContent);
        } catch (err) {
            console.error('Could not read existing keys file, creating new one.', err);
        }
        existingKeys[email] = privateKey;
        await fs.writeFile(privateKeyPath, JSON.stringify(existingKeys, null, 2), { flag: 'w' });
        res.status(201).json(savedUser);
    } catch (err) {
        res.sendStatus(500);
        console.error(err);
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
}

const getUsers = async (req, res) => {
    try {
        const email = req.user;
        const users = await User.find({ email: { $ne: email } });
        const usersWithDetails = await Promise.all(users.map(async (user) => {
            let latestMessage = await Message.findOne({
                $or: [{ sender: user.email, receiver: email }, { sender: email, receiver: user.email }]
            }).sort({ timestamp: -1 }).exec();
            const encryptedPrivateKey = await getPrivateKeyFromConfig(latestMessage.receiver)
            const privateKey = await decryptPrivateKey(encryptedPrivateKey, 'your-passphrase')
            if (!privateKey) return
            let imageData = "";
            let decryptedMessage = ''
            try {
                decryptedMessage = await decryptMessage(privateKey, latestMessage.message);
            } catch (error) {
                console.error(`Error decrypting message for recipient ${email}:`, error);
                decryptedMessage = 'Error decrypting message';
            }
            if (user.image) {
                try {
                    const imagePath = path.join(uploadsDir, user.image);
                    const data = await fs.readFile(imagePath);
                    imageData = data.toString('base64');
                } catch (err) {
                    console.error(`Error reading image for user ${user.email}:`, err);
                }
            }
            return { ...user.toObject(), imageData, latestMessage: { ...latestMessage._doc, message: decryptedMessage } };
        }))
        res.status(200).json({ users: usersWithDetails });
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
};

const getUserProfile = async (req, res) => {
    try {
        const email = req.user;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ user: null })
        const imageData = user.image ? await readImage(user.image) : null
        res.status(200).json({ user: { ...user.toObject(), imageData } })
    } catch (err) { res.sendStatus(500) }
};

const getUser = async (req, res) => {
    try {
        const { email } = req.params;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ user: null });
        const imageData = user.image ? await readImage(user.image) : null;
        res.status(200).json({ user: { ...user.toObject(), imageData } });
    } catch (err) { res.sendStatus(500) }
};

const updateUser = async (req, res) => {
    try {
        const email = req.user;
        const image = req.file.path;
        const updatedUser = await User.updateOne({ email }, { image });
        if (!updatedUser) return res.sendStatus(400);
        res.status(201).json({});
    } catch (err) { res.sendStatus(500) }
};


const createGroup = async (req, res) => {
    try {
        const { name } = req.body;
        const admin = req.user;
        const existingGroup = await Group.findOne({ name });
        if (existingGroup) return res.sendStatus(400);
        let image = ''
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


const getGroups = async (req, res) => {
    try {
        const userEmail = req.user;
        const groups = await Group.find({ "members.email": userEmail });
        const groupsWithImages = await Promise.all(groups.map(async (group) => {
            let latestMessage = await GMessage.findOne({ group: group.name }).sort({ timestamp: -1 }).exec();
            let imageData = null
            if (group.image) imageData = await readImage(group.image);
            return { ...group.toObject(), imageData, latestMessage };
        }));
        res.status(200).json({ groups: groupsWithImages });
    } catch (err) { res.sendStatus(500) }
};

const getGroup = async (req, res) => {
    try {
        const { name } = req.params;
        const group = await Group.findOne({ name });
        if (!group) return res.status(404).json({ group: null });
        const members = await Promise.all(group.members.map(async (member) => {
            const user = await User.findOne({ email: member.email });
            if (!user) return null
            return { ...user.toObject(), role: member.role };
        }));

        const memberImages = await Promise.all(members.map(async (user) => {
            if (!user) return null;
            const imageData = user.image ? await readImage(user.image) : ''
            return { ...user, imageData };
        }));

        const groupImageData = group.image ? await readImage(group.image) : null;

        res.status(200).json({
            group: {
                ...group.toObject(),
                imageData: groupImageData,
                members: memberImages 
            }
        });

    } catch (err) {
        console.error('Error fetching group data:', err);
        res.sendStatus(500);
    }
};

const updateGroup = async (req, res) => {

    try {
        const { group } = req.params
        const filePath = req.file.path
        const result = await Group.updateOne({ name: group }, { image: filePath })
        if (!result) res.sendStatus(500)
        res.status(200).json({ message: 'group updated' })
    } catch (err) {
        console.error(err)
    }
}

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
    updateGroup,
    addMember
};
