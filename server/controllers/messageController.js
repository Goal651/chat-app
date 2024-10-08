const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { Message, GMessage, User, Group } = require('../models/models');


const decryptPrivateKey = (encryptedPrivateKey) => {
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


const getMessage = async (req, res) => {
  try {
    const { receiver } = req.query;
    const sender = req.user;
    if (!sender || !receiver) return res.status(400).json({ message: 'Sender and receiver are required' });
    const messages = await Message.find({ $or: [{ sender: sender, receiver: receiver }, { sender: receiver, receiver: sender }] });
    if (messages.length === 0) return res.status(200).json({ messages: [] });
    const messageWithDetails = await Promise.all(messages.map(async (message) => {
      const recipient = message.receiver
      const user = await User.findOne({ email: recipient });
      if (!user) { return { ...message._doc, message: '', image: null } }
      const encryptedPrivateKey = await getPrivateKeyFromConfig(recipient);
      const privateKey = decryptPrivateKey(encryptedPrivateKey);
      if (!privateKey) return { ...message._doc, message: 'Error decrypting message', image: null };
      let decryptedMessage = '';
      let fileData = null;
      if (message.type === 'text') {
        try {
          decryptedMessage = await decryptMessage(privateKey, message.message);
        } catch (error) {
          console.error(`Error decrypting message for recipient ${recipient}:`, error);
          decryptedMessage = 'Error decrypting message';
        }
      }
      else if (message.type.startsWith('image')) {
        try {
          const filePath = path.join(message.message);
          const data = await fs.readFile(filePath);
          fileData = `data:image/jpeg;base64, ${data.toString('base64')}`;
        } catch (err) { console.log(`Error reading image for user ${message.sender}:`, err) }
      }
      else if (message.type.startsWith('video')) {
        try {
          const filePath = path.join(message.message);
          const data = await fs.readFile(filePath);
          fileData = `data:video/mp4;base64,${data.toString('base64')}`;
        } catch (err) { console.log(`Error reading image for user ${message.sender}:`, err) }
      }
      else if (message.type.startsWith('audio')) {
        try {
          const filePath = path.join(message.message);
          const data = await fs.readFile(filePath);
          fileData = `data:audio/mp3;base64,${data.toString('base64')}`;
        } catch (err) { console.log(`Error reading image for user ${message.sender}:`, err) }
      }
      return { ...message._doc, message: decryptedMessage, file: fileData };
    }));
    res.status(200).json({ messages: messageWithDetails });
  } catch (error) {
    res.sendStatus(500);
    console.log(error);
  }
}

const getGMessage = async (req, res) => {
  const { group } = req.params;
  if (!group) return res.sendStatus(400);
  const groupData = await Group.findOne({ name: group });
  if (!groupData) return res.sendStatus(404);
  const { aesKey, iv, encryptedPrivateKey } = groupData
  const privateKey = decryptGroupPrivateKey({ aesKey, iv, encryptedPrivateKey });
  const gmessages = await GMessage.find({ group: group });
  if (gmessages.length === 0) return res.status(200).json({ gmessages: [] });
  try {
    const gmsWithDetails = await Promise.all(gmessages.map(async gm => {
      const senderUser = await User.findOne({ email: gm.sender })
      const senderUsername = senderUser.username
      if (!senderUser) return { ...gm._doc, senderUsername, image: null, message: '' };
      let decryptedMessage = ''
      let file = null;
      if (gm.type == 'text') {
        try {
          decryptedMessage = await decryptGroupMessage({ privateKey, iv: groupData.iv, message: gm.message });
        } catch (error) {
          console.error(`Error decrypting message for recipient ${recipient}:`, error);
          decryptedMessage = 'Error decrypting message';
        }
      }
      else if (gm.type.startsWith('image')) {
        try {
          const filePath = path.join(gm.message);
          const data = await fs.readFile(filePath);
          file= `data:image/jpeg;base64, ${data.toString('base64')}`;
        } catch (err) { console.log(`Error reading image for user ${message.sender}:`, err) }
      }
      else if (gm.type.startsWith('video')) {
        try {
          const filePath = path.join(gm.message);
          const data = await fs.readFile(filePath);
          file = `data:video/mp4;base64,${data.toString('base64')}`;
        } catch (err) { console.log(`Error reading image for user ${gm.sender}:`, err) }
      }
      else if (gm.type.startsWith('audio')) {
        try {
          const filePath = path.join(gm.message);
          const data = await fs.readFile(filePath);
          file = `data:audio/mp3;base64,${data.toString('base64')}`;
        } catch (err) { console.log(`Error reading image for user ${message.sender}:`, err) }
      }
      return { ...gm._doc, senderUsername, image:file, message: decryptedMessage };
    }))
    res.status(200).json({ gmessages: gmsWithDetails });
  } catch (error) {
    res.sendStatus(500);
    console.log(error);
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { id } = await req.params
    if (!id) return res.sendStatus(400)
    const result = await Message.findByIdAndDelete(id)
    if (!result) return res.sendStatus(500)
    res.status(200).json({ messageDeleted: id })
  }
  catch (err) { res.sendStatus(500) }
}

const editMessage = async (req, res) => {
  try {
    const { id, message } = await req.body
    if (!id && !message) return res.sendStatus(400)
    const result = await Message.updateOne({ id }, { message: message, edited: true })
    if (!result) return res.sendStatus(500)
    res.status(200).json({})
  } catch (err) { console.error(err) }
}



module.exports = {
  getMessage,
  getGMessage,
  deleteMessage,
  editMessage,
};
