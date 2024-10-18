const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Group, GMessage, Message } = require('../models/models');
const uploadsDir = path.join(__dirname, '../');
const crypto = require('crypto');
const md5 = require('md5')
const AES_KEY_LENGTH = 32;

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
                passphrase: process.env.KEY_PASSPHRASE // Ensure to use a secure passphrase
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
            passphrase: process.env.KEY_PASSPHRASE
        });
        return keyObject.export({ type: 'pkcs1', format: 'pem' });
    } catch (err) {
        console.error('Error decrypting private key:', err);
        throw err;
    }
};

const decryptGroupMessage = (data) => {
    try {
        if (!data) return
        const ivBuffer = Buffer.from(data.iv, 'hex')
        const aesKeyBuffer = Buffer.from(data.privateKey, 'hex')
        const encryptedMessage = Buffer.from(data.message, 'hex');
        console.log(data)
        const decipher = crypto.createDecipheriv('aes-256-cbc', aesKeyBuffer, ivBuffer)
        console.log(decipher)
        let decryptedMessage = decipher.update(encryptedMessage, undefined, 'utf-8')
        decryptedMessage += decipher.final('utf-8')
        return decryptedMessage
    } catch (err) { console.error(err) }
}

const decryptGroupPrivateKey = (data) => {
    const ivBuffer = Buffer.from(data.iv, 'hex')
    const aesKeyBuffer = Buffer.from(data.aesKey, 'hex')
    const encryptedPrivateKeyBuffer = Buffer.from(data.encryptedPrivateKey, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', aesKeyBuffer, ivBuffer)
    let decryptedPrivateKey = decipher.update(encryptedPrivateKeyBuffer, undefined, 'utf8')
    decryptedPrivateKey += decipher.final('utf-8')
    return decryptedPrivateKey
}

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
        const config = JSON.parse(await fs.promises.readFile(configPath, 'utf8'));
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
            const fileContent = await fs.promises.readFile(privateKeyPath, 'utf8');
            existingKeys = JSON.parse(fileContent);
        } catch (err) {
            console.error('Could not read existing keys file, creating new one.', err);
        }
        existingKeys[email] = privateKey;
        await fs.promises.writeFile(privateKeyPath, JSON.stringify(existingKeys, null, 2), { flag: 'w' });
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
        const accessToken = jwt.sign({ email: user.email, id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
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
            let decryptedMessage = ''
            if (latestMessage && latestMessage.type === 'text') {
                const encryptedPrivateKey = await getPrivateKeyFromConfig(latestMessage.receiver)
                const privateKey = await decryptPrivateKey(encryptedPrivateKey, 'your-passphrase')
                if (!privateKey) return
                try {
                    decryptedMessage = await decryptMessage(privateKey, latestMessage.message);
                } catch (error) {
                    console.error(`Error decrypting message for recipient ${email}:`, error);
                    decryptedMessage = 'Error decrypting message';
                }
            }
            let imageData = "";
            if (user.image) {
                try {
                    const imagePath = await readImage(user.image);
                    imageData = imagePath;
                } catch (err) {
                    console.error(`Error reading image for user ${user.email}:`, err);
                }
            }
            return { ...user.toObject(), imageData, latestMessage: latestMessage ? { ...latestMessage._doc, message: decryptedMessage } : null };
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
        const aesKey = crypto.randomBytes(AES_KEY_LENGTH);
        const privateKey = crypto.randomBytes(32).toString('hex'); // Example private key generation
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv);
        let encryptedPrivateKey = cipher.update(privateKey, 'utf8', 'hex');
        encryptedPrivateKey += cipher.final('hex');
        let image = '';
        if (req.file) image = req.file.path;
        const newGroup = new Group({
            name,
            admin,
            image,
            members: [{ email: admin, role: 'admin' }],
            aesKey: aesKey.toString('hex'),
            iv: iv.toString('hex'),
            encryptedPrivateKey
        });
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
        if (!groups) return res.sendStatus(404)
        const groupsWithImages = await Promise.all(groups.map(async (group) => {
            const { aesKey, iv, encryptedPrivateKey } = group
            let lMessage = ''
            const privateKey = decryptGroupPrivateKey({ aesKey, iv, encryptedPrivateKey })
            if (!privateKey) return null
            const latestMessage = await GMessage.findOne({ group: group.name }).sort({ timestamp: -1 }).exec();
            if (latestMessage) {
                let message = ''
                if (latestMessage.type == 'text') message = decryptGroupMessage({ privateKey, iv, message: latestMessage.message })
                else message = 'sent file'
                lMessage = { ...latestMessage._doc, message }
            }
            const details = await groupDetails(group.name)
            let imageData = null
            if (group.image) imageData = await readImage(group.image);
            return { ...group.toObject(), imageData, latestMessage: lMessage, details };
        }));
        res.status(200).json({ groups: groupsWithImages });
    } catch (err) {
        res.sendStatus(500)
        console.log(err)
    }
};

const getGroup = async (req, res) => {
    try {
        const { name } = req.params;
        const details = await groupDetails(name)
        const group = await Group.findOne({ name });
        if (!group) return res.status(404).json({ group: null });
        if (!group.members.some(user => user.email === req.user)) return res.status(200).json({ group: null });
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
                members: memberImages,
                details
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
        const imageBuffer = await fs.promises.readFile(fullPath);
        return `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
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

const fileUpload = async (req, res) => {
    const { name, totalchunks, currentchunk } = req.headers;
    const filename = decodeURIComponent(name);
    const { file } = req.body;
    const firstChunk = parseInt(currentchunk) === 0;
    const lastChunk = parseInt(currentchunk) === parseInt(totalchunks) - 1;
    const ext = filename.split('.').pop();
    const data = file.split(',')[1];
    const buffer = Buffer.from(data, 'base64');
    const tmpFilename = 'tmp_' + md5(filename) + '.' + ext;
    const tmpFilepath = path.join(__dirname, '../uploads/messages/', tmpFilename);
    if (firstChunk && fs.existsSync(tmpFilepath)) fs.unlinkSync(tmpFilepath);
    fs.appendFileSync(tmpFilepath, buffer);
    if (lastChunk) {
        const finalFileName = md5(Date.now().toString().slice(0, 6) + req.id) + filename;
        const finalFilepath = path.join(__dirname, '../uploads/messages/', finalFileName);
        fs.renameSync(tmpFilepath, finalFilepath);
        const fileUrl = `http://localhost:3001/uploads/messages/${finalFileName}`;
        console.log(fileUrl)
        return res.status(200).json({ finalFileName: finalFilepath });
    }
    res.status(200).json({ message: 'Chunk ' + currentchunk + ' received' });
};


const groupDetails = async (group) => {
    const gms = await GMessage.find({ group: group })
    let images = 0
    let videos = 0
    let audios = 0
    await Promise.all(gms.map(async (gm) => {
        if (gm.type.startsWith('image')) images += 1
        else if (gm.type.startsWith('video')) videos += 1
        else if (gm.type.startsWith('audio')) audios += 1
    }))
    return { images, videos, audios }
}





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
    addMember,
    fileUpload
};
