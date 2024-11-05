const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { Message, GMessage, User, Group } = require('../models/models');

const decryptPrivateKey = (encryptedPrivateKey) => {
  try {
    const keyObject = crypto.createPrivateKey({
      key: encryptedPrivateKey,
      format: 'pem',
      passphrase: process.env.KEY_PASSPHRASE,
    });
    return keyObject.export({ type: 'pkcs1', format: 'pem' });
  } catch (err) {
    console.error('Error decrypting private key:', err);
    throw err;
  }
};

const decryptGroupPrivateKey = ({ data, aesKey, iv }) => {
  try {
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(aesKey, 'hex'), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(Buffer.from(data, 'hex'), undefined, 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
  } catch (err) {
    console.error('Error decrypting data:', err);
    return null;
  }
};

const decryptGroupMessage = ({ data, aesKey, iv }) => {
  try {
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(aesKey, 'hex'), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(Buffer.from(data, 'hex'), 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
  } catch (err) {
    console.error('Error decrypting data:', err);
    return null;
  }
};


const getFileData = async (filePath, mimeType) => {
  try {
    const data = await fs.readFile(filePath);
    return `data:${mimeType};base64,${data.toString('base64')}`;
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
    return null;
  }
};

const getPrivateKey = async (email) => {
  try {
    const user = await User.findOne({ email }).select('privateKey')
    return user.privateKey
  } catch (err) {
    console.error('Error reading private key from config:', err);
    throw err;
  }
};

const decryptMessageContent = async ({ message, privateKey }) => {
  try {
    return crypto.privateDecrypt(
      { key: privateKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING },
      Buffer.from(message, 'base64')
    ).toString('utf-8');
  } catch (err) {
    console.error('Error decrypting message content:', err);
    return 'Error decrypting message';
  }
};

const formatMessageData = async ({ message, privateKey, type,...rest }) => {
  let decryptedMessage = '';
  let fileData = null;

  switch (message.type) {
    case 'text':
      if (type == 'users') decryptedMessage = await decryptMessageContent({ message: message.message, privateKey });
      else if(type=='groups') decryptedMessage=decryptGroupMessage({data:message,...rest.aesKey,...rest.iv})
      break;
    case 'image/jpeg':
      fileData = await getFileData(message.message, 'image/jpeg');
      break;
    case 'video/mp4':
      fileData = await getFileData(message.message, 'video/mp4');
      break;
    case 'audio/mp3':
      fileData = await getFileData(message.message, 'audio/mp3');
      break;
    default:
      console.error('Unsupported message type:', message.type);
  }

  return { message: decryptedMessage, file: fileData };
};

const getMessage = async (req, res) => {
  try {
    const { receiver } = req.query;
    const sender = req.user;

    if (!sender || !receiver) return res.status(400).json({ message: 'Sender and receiver are required' });

    const messages = await Message.find({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender },
      ],
    }).populate('replyingTo.messageId');

    if (!messages.length) return res.status(200).json({ messages: [] });

    const messageDetails = await Promise.all(messages.map(async (msg) => {
      const recipient = msg.receiver;
      const user = await User.findOne({ email: recipient });

      if (!user) return { ...msg._doc, message: '', image: null };

      const encryptedPrivateKey = await getPrivateKey(recipient);
      const privateKey = decryptPrivateKey(encryptedPrivateKey);
      if (!privateKey) return { ...msg._doc, message: 'Error decrypting message', image: null };

      const { message: decryptedMessage, file: fileData } = await formatMessageData({ msg, privateKey, type: 'users' });

      let decryptedReplyingToMessage = null;
      if (msg.replyingTo && msg.replyingTo.messageId) {
        const replyingToMessage = await Message.findById(msg.replyingTo.messageId._id);
        if (replyingToMessage) {
          const { message: replyingMessageContent, file: replyingFileData } = await formatMessageData({ message: replyingToMessage, privateKey, type: 'users' });
          decryptedReplyingToMessage = { ...replyingToMessage._doc, message: replyingMessageContent, file: replyingFileData };
        }
      }

      return { ...msg._doc, message: decryptedMessage, file: fileData, replyingMessage: decryptedReplyingToMessage || null };
    }));

    res.status(200).json({ messages: messageDetails });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
};

const getGMessage = async (req, res) => {
  try {
    const { group } = req.params;
    const groupData = await Group.findOne({ name: group }).select('aesKey iv encryptedPrivateKey');

    if (!groupData) return res.sendStatus(404);

    const { aesKey, iv, encryptedPrivateKey } = groupData;
    const privateKey = decryptGroupPrivateKey({ data: encryptedPrivateKey, aesKey, iv });

    const gmessages = await GMessage.find({ group });
    if (!gmessages.length) return res.status(200).json({ gmessages: [] });

    const gmsWithDetails = await Promise.all(gmessages.map(async (gm) => {
      const senderUser = await User.findOne({ email: gm.sender });
      const senderUsername = senderUser ? senderUser.username : null;

      const { message: decryptedMessage, file } = await formatMessageData({ message: gm, privateKey, iv, aesKey, type: 'group' });

      let decryptedReplyingToMessage = null;
      if (gm.replyingTo && gm.replyingTo.messageId) {
        const replyingToMessage = await GMessage.findById(gm.replyingTo.messageId._id);
        if (replyingToMessage) {
          decryptedReplyingToMessage = { ...replyingToMessage._doc, message: decryptGroupMessage({ data: replyingToMessage.message, aesKey, iv }) };
        }
      }

      return { ...gm._doc, senderUsername, file, message: decryptedMessage, replyingMessage: decryptedReplyingToMessage || null };
    }));

    res.status(200).json({ gmessages: gmsWithDetails });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.sendStatus(400);

    const result = await Message.findByIdAndDelete(id);
    if (!result) return res.sendStatus(500);

    res.status(200).json({ messageDeleted: id });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

const editMessage = async (req, res) => {
  try {
    const { id, message } = req.body;
    if (!id || !message) return res.sendStatus(400);
    const result = await Message.updateOne({ _id: id }, { message, edited: true });
    if (!result.nModified) return res.sendStatus(500);
    res.status(200).json({});
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

module.exports = {
  getMessage,
  getGMessage,
  deleteMessage,
  editMessage,
};
