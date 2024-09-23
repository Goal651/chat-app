const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { Message, GMessage, User } = require('../models/models');


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

const getSingleMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { sender} = req.body;
    const receiver = req.user;
    if (!messageId || !sender || !receiver) return res.status(400).json({ message: 'Message ID, sender, and receiver are required' });
    const message = await Message.findOne({ _id: messageId, $or: [{ sender, receiver }, { sender: receiver, receiver: sender }] });
    if (!message) return res.status(404).json({ message: 'Message not found' });

    const recipient = message.receiver;
    const user = await User.findOne({ email: recipient });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const encryptedPrivateKey = await getPrivateKeyFromConfig(recipient);
    const privateKey = decryptPrivateKey(encryptedPrivateKey);
    if (!privateKey) return res.status(500).json({ message: 'Error decrypting message' });

    let decryptedMessage = '';
    let fileData = null;

    if (message.type === 'text') {
      try {
        decryptedMessage = await decryptMessage(privateKey, message.message);
      } catch (error) {
        console.error('Error decrypting message:', error);
        decryptedMessage = 'Error decrypting message';
      }
    } else if (message.type.startsWith('image')) {
      try {
        const filePath = path.join(message.message);
        const data = await fs.readFile(filePath);
        fileData = `data:image/jpeg;base64, ${data.toString('base64')}`;
      } catch (err) {
        console.error('Error reading image file:', err);
      }
    } else if (message.type.startsWith('video')) {
      try {
        const filePath = path.join(message.message);
        const data = await fs.readFile(filePath);
        fileData = `data:video/mp4;base64,${data.toString('base64')}`;
      } catch (err) {
        console.error('Error reading video file:', err);
      }
    }

    return res.status(200).json({ ...message._doc, message: decryptedMessage, file: fileData });
  } catch (error) {
    console.error('Error retrieving message:', error);
    res.status(500).json({ message: 'Server error' });
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
      return { ...message._doc, message: decryptedMessage, file: fileData };
    }));
    res.status(200).json({ messages: messageWithDetails });
  } catch (error) {
    res.sendStatus(500);
    console.log(error);
  }
};


const getSingleGMessage = async (req, res) => {
  try {
    const { messageId } = req.params; // Assume the message ID is passed in the URL parameters
    const { group } = req.query;

    if (!messageId || !group) {
      return res.status(400).json({ message: 'Message ID and group are required' });
    }

    // Find the single group message based on the message ID and group
    const gmessage = await GMessage.findOne({ _id: messageId, group });
    if (!gmessage) {
      return res.status(404).json({ message: 'Group message not found' });
    }

    const senderUser = await User.findOne({ email: gmessage.sender });
    if (!senderUser) {
      return res.status(404).json({ message: 'Sender not found' });
    }

    const senderUsername = senderUser.username;
    const encryptedPrivateKey = await getPrivateKeyFromConfig(gmessage.sender);
    const privateKey = decryptPrivateKey(encryptedPrivateKey);

    if (!privateKey) {
      return res.status(500).json({ message: 'Error decrypting message' });
    }

    let decryptedMessage = '';
    let fileData = null;

    if (gmessage.type === 'text') {
      try {
        decryptedMessage = await decryptMessage(privateKey, gmessage.message);
      } catch (error) {
        console.error('Error decrypting message:', error);
        decryptedMessage = 'Error decrypting message';
      }
    } else if (gmessage.type.startsWith('image')) {
      try {
        const filePath = path.join(gmessage.message);
        const data = await fs.readFile(filePath);
        fileData = `data:image/jpeg;base64,${data.toString('base64')}`;
      } catch (err) {
        console.error('Error reading image file:', err);
      }
    } else if (gmessage.type.startsWith('video')) {
      try {
        const filePath = path.join(gmessage.message);
        const data = await fs.readFile(filePath);
        fileData = `data:video/mp4;base64,${data.toString('base64')}`;
      } catch (err) {
        console.error('Error reading video file:', err);
      }
    }

    return res.status(200).json({ ...gmessage._doc, senderUsername, message: decryptedMessage, file: fileData });
  } catch (error) {
    console.error('Error retrieving group message:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



const getGMessage = async (req, res) => {
  const { group } = req.params;
  if (!group) return res.sendStatus(400);
  const gmessages = await GMessage.find({ group: group });
  if (gmessages.length === 0) return res.status(200).json({ gmessages: [] });
  try {
    const gmsWithDetails = await Promise.all(gmessages.map(async gm => {
      const senderUser = await User.findOne({ email: gm.sender })
      const senderUsername = senderUser.username
      if (!senderUser) return { ...gm._doc, senderUsername, image: null, message: '' };
      const encryptedPrivateKey = await getPrivateKeyFromConfig(gm.sender)
      const privateKey = decryptPrivateKey(encryptedPrivateKey, 'your-passphrase')
      let decryptedMessage = ''
      let image = null;
      if (gm.type == 'text') {
        try {
          decryptedMessage = await decryptMessage(privateKey, gm.message);
        } catch (error) {
          console.error(`Error decrypting message for recipient ${recipient}:`, error);
          decryptedMessage = 'Error decrypting message';
        }
      }
      if (gm.type.startsWith('image')) {
        try {
          const imagePath = path.join(gm.message);
          const data = await fs.readFile(imagePath);
          image = data.toString('base64');
        } catch (err) { console.log(`Error reading image for user:`, err) }
      }
      return { ...gm._doc, senderUsername, image, message: decryptedMessage };
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
    res.sendStatus(200).json({ messageDeleted: id })
  }
  catch (err) { res.sendStatus(500) }
}

const editMessage = async (req, res) => {
  try {
    const { id, message } = await req.body
    if (!id) return res.sendStatus(400)
    const result = await Message.updateOne({ id }, { message })
    if (!result) return res.sendStatus(500)
    res.status(200).json({})
  } catch (err) { console.error(err) }
}



module.exports = {
  getMessage,
  getGMessage,
  deleteMessage,
  editMessage,
  getSingleMessage,
  getSingleGMessage
};
