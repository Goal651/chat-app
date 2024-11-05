const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Group, GMessage, Message } = require('../models/models');
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
                passphrase: process.env.KEY_PASSPHRASE
            }
        }, (err, publicKey, privateKey) => {
            if (err) return reject(err);
            resolve({ publicKey, privateKey });
        });
    });
}
const readImage = async (imagePath) => {
    try {
        const imageBuffer = await fs.promises.readFile(imagePath);
        return `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
    } catch (err) {
        console.error('Error reading image:', err);
        return null;
    }
};

const generateGroupKeys = () => {
    try {
        const aesKey = crypto.randomBytes(AES_KEY_LENGTH);
        const privateKey = crypto.randomBytes(32).toString('hex');
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv);
        let encryptedPrivateKey = cipher.update(privateKey, 'utf8', 'hex');
        encryptedPrivateKey += cipher.final('hex');
        return { encryptedPrivateKey, aesKey, iv }
    } catch (err) { throw err }
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
        const decipher = crypto.createDecipheriv('aes-256-cbc', aesKeyBuffer, ivBuffer)
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

const getPrivateKey = async (email) => {
    try {
        const user = await User.findOne({ email: email }).select('privateKey')
        return user.privateKey;
    } catch (error) {
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
        const newUser = new User({
            email,
            password: hash,
            username,
            names,
            publicKey,
            privateKey
        });
        const savedUser = await newUser.save();
        if (!savedUser) return res.sendStatus(500);
        res.status(201).json({ message: 'account created' });
    } catch (err) {
        res.sendStatus(500);
        console.error(err);
    }
};

// User Login
const login = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email }).select('id email password');
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
        const users = await User.find({ email: { $ne: email } }).select('email username names image privateKey'); // Projection to reduce fields
        const privateKeyMap = {};

        const usersWithDetails = await Promise.all(users.map(async (user) => {
            const latestMessage = await Message
                .findOne({ $or: [{ sender: user.email, receiver: email }, { sender: email, receiver: user.email }] })
                .sort({ timestamp: -1 })
                .lean()
                .exec();

            let decryptedMessage = '';

            if (latestMessage && latestMessage.type === 'text') {
                if (!privateKeyMap[latestMessage.receiver]) {
                    const encryptedPrivateKey = await getPrivateKey(latestMessage.receiver);
                    privateKeyMap[latestMessage.receiver] = await decryptPrivateKey(encryptedPrivateKey);
                }
                decryptedMessage = await decryptMessage(privateKeyMap[latestMessage.receiver], latestMessage.message);
            }

            const imageData = user.image ? await readImage(user.image) : null;

            return {
                id: user._id,
                username: user.username,
                names: user.names,
                email: user.email,
                image: user.image,
                latestMessage: latestMessage ? { ...latestMessage, message: decryptedMessage } : null,
                imageData
            };
        }));
        res.status(200).json({ users: usersWithDetails });
    } catch (err) {
        res.status(500).json({ message: 'Server error ' + err });
    }
};


const getUserProfile = async (req, res) => {
    try {
        const email = req.user;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'user not found' })
        const imageData = user.image ? await readImage(user.image) : null
        const userObject = {
            id: user._id,
            username: user.username,
            names: user.names,
            email: user.email,
            image: user.image,
            imageData
        }
        res.status(200).json({ user: userObject })
    } catch (err) { res.status(500).json({ message: 'Server error ' + err }) }
};

const getUser = async (req, res) => {
    try {
        const { email } = req.params;
        const user = await User.findOne({ email }).select('_id username names email image lastActiveTime');
        if (!user) return res.status(404).json({ message: 'user not found' });
        const imageData = user.image ? await readImage(user.image) : null;
        const userObject = {
            id: user._id,
            username: user.username,
            names: user.names,
            email: user.email,
            image: user.image,
            imageData,
            lastActiveTime: user.lastActiveTime
        }
        res.status(200).json({ user: userObject });
    } catch (err) { res.status(500).json({ message: 'Server error' + err }) }
};

const updateUser = async (req, res) => {
    try {
        const email = req.user;
        const image = req.body;
        const updatedUser = await User.updateOne({ email }, { image: image.imageUrl });
        if (!updatedUser) return res.sendStatus(400);
        res.status(201).json({ message: 'user updated' });
    } catch (err) { res.status(500).json({ message: 'server error ', err }) }
};

const createGroup = async (req, res) => {
    try {
        const { name, image } = req.body;
        const admin = req.user;
        const existingGroup = await Group.findOne({ name });
        if (existingGroup) return res.status(400).json({ message: 'Group already exists' });
        const { aesKey, encryptedPrivateKey, iv } = generateGroupKeys()
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
        if (!savedGroup) return res.status(500).json({ message: 'Failed to create group' });
        await User.updateOne({ email: admin }, { $push: { groups: name } });
        res.status(201).json({ message: 'Group created' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' + err });
    }
};

const getGroups = async (req, res) => {
    try {
        const userEmail = req.user;
        const groups = await Group.find({ "members.email": userEmail });
        if (!groups) return res.status(404).json({ message: 'group not found' })
        const groupsWithImages = await Promise.all(groups.map(async (group) => {
            const { aesKey, iv, encryptedPrivateKey } = group
            let lastMessage = ''
            let imageData = null
            const privateKey = decryptGroupPrivateKey({ aesKey, iv, encryptedPrivateKey })
            if (!privateKey) return
            const latestMessage = await GMessage
                .findOne({ group: group.name })
                .sort({ timestamp: -1 })
                .exec();

            if (latestMessage) {
                let message = ''
                if (latestMessage.type == 'text') message = decryptGroupMessage({ privateKey, iv, message: latestMessage.message })
                else message = 'sent file'
                lastMessage = { ...latestMessage._doc, message }
            }
            const details = await groupDetails(group.name)
            if (group.image) imageData = await readImage(group.image);

            return {
                id: group._id,
                name: group.name,
                members: group.members,
                image: group.image,
                imageData,
                latestMessage: lastMessage,
                details
            }
        }));
        res.status(200).json({ groups: groupsWithImages });
    } catch (err) {
        res.status(500).json({ message: 'Server error' + err });
    }
};

const getGroup = async (req, res) => {
    try {
        const { name } = req.params;
        const group = await Group.findOne({ name });
        if (!group) return res.status(404).json({ message: 'Group not found' });
        if (!group.members.some(user => user.email === req.user)) return res.status(400).json({ message: 'You are not a member of this group' });
        const details = await groupDetails(name)
        const members = await Promise.all(group.members.map(async (member) => {
            const user = await User.findOne({ email: member.email });
            if (!user) return null
            return {
                id: user._id,
                username: user.username,
                names: user.names,
                email: user.email,
                image: user.image,
                role:member.role,
            }
        }));

        const memberImages = await Promise.all(members.map(async (user) => {
            if (!user) return null;
            const imageData = user.image ? await readImage(user.image) : ''
            return { ...user, imageData };
        }));

        const groupImageData = group.image ? await readImage(group.image) : null;

        const groupObject = {
            id: group._id,
            name: group.name,
            admin:group.admin,
            members: memberImages,
            image: group.image,
            imageData: groupImageData,
            latestMessage: null,
            details
        }
        res.status(200).json({ group: groupObject});
    } catch (err) {
        res.status(500).json({ message: 'Server error' + err });
    }
};

const updateGroup = async (req, res) => {
    try {
        const { group } = req.params
        const filePath = req.file.path
        const isGroupThere = await Group.findOne({ name: group })
        if (!isGroupThere) return res.status(404).json({ message: 'Group not found' })
        await Group.updateOne({ name: group }, { image: filePath })
        res.status(200).json({ message: 'group updated' })
    } catch (err) {
        res.status(500).json({ message: 'server error', err })
    }
}


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
        res.status(500).json({ message: 'Server error' + err });
    }
};

const fileUpload = async (req, res) => {
    try {
        const { name, totalchunks, currentchunk, typeFolder } = req.headers;
        const filename = decodeURIComponent(name);
        const { file } = req.body;
        await fs.promises.mkdir(path.join(__dirname, `../uploads/${typeFolder}/`), { recursive: true });
        const firstChunk = parseInt(currentchunk) === 0;
        const lastChunk = parseInt(currentchunk) === parseInt(totalchunks) - 1;
        const ext = filename.split('.').pop();
        const data = file.split(',')[1];
        const buffer = Buffer.from(data, 'base64');
        const tmpFilename = 'tmp_' + md5(filename) + '.' + ext;
        const tmpFilepath = path.join(__dirname, `../uploads/${typeFolder}/`, tmpFilename);
        if (firstChunk && fs.existsSync(tmpFilepath)) fs.unlinkSync(tmpFilepath);
        fs.appendFileSync(tmpFilepath, buffer);
        if (lastChunk) {
            const finalFileName = md5(Date.now().toString().slice(0, 6) + req.id).slice(0, 6) + filename;
            const finalFilepath = path.join(__dirname, `../uploads/${typeFolder}/`, finalFileName);
            fs.renameSync(tmpFilepath, finalFilepath);
            return res.status(200).json({ finalFileName: finalFilepath });
        }
        res.status(200).json({ message: 'Chunk ' + currentchunk + ' received' });
    }
    catch (err) {
        res.status(500).json({ message: 'Server error' + err });
    }
};




const groupDetails = async (group) => {
    try {
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
    catch (err) { return { images: 0, videos: 0, audios: 0 } }
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
    fileUpload,
};
