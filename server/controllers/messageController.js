const { Message, GMessage, User } = require('../models/models');
const fs = require('fs').promises;
const path = require('path');

const getMessage = async (req, res) => {
  try {
    const { receiver } = req.query;
    const sender = req.user;
    if (!sender || !receiver) return res.status(400).json({ message: 'Sender and receiver are required' });
    const messages = await Message.find({ $or: [{ sender: sender, receiver: receiver }, { sender: receiver, receiver: sender }] });
    if (messages.length === 0) return res.status(200).json({ messages: [] });
    const messageWithDetails = await Promise.all(messages.map(async (message) => {
      let imageData = null;
      if (message.type.startsWith('image')) {
        const imagePath = path.join(message.message);
        try {
          const data = await fs.readFile(imagePath);
          imageData = data.toString('base64');
        } catch (err) { console.log(`Error reading image for user ${message.sender}:`, err) }
      }
      return { ...message._doc, image: imageData }
    }));

    res.status(200).json({ messages: messageWithDetails });
  } catch (error) {
    res.sendStatus(500);
    console.log(error);
  }
};


const getGMessage = async (req, res) => {
  const { group } = req.params;
  if (!group) return res.sendStatus(400);
  const users = await User.find();
  const userMap = new Map(users.map(user => [user.email, user]));
  const gmessages = await GMessage.find({ group: group });
  if (gmessages.length === 0) return res.status(200).json({ gmessages: [] });
  try {
    const gmsWithDetails = await Promise.all(gmessages.map(async gm => {
      let senderUsername = ''
      let image = null;
      if (gm.type.startsWith('image')) {
        const imagePath = path.join(gm.message);
        try {
          const data = await fs.readFile(imagePath);
          image = data.toString('base64');
        } catch (err) { console.log(`Error reading image for user:`, err) }
      }
      const user = userMap.get(gm.sender);
      senderUsername = user.username
      return { ...gm._doc,  senderUsername, image };
    }))
    res.status(200).json({ gmessages: gmsWithDetails });
  } catch (error) {
    res.sendStatus(500);
    console.log(error);
  }
};

const deleteMessage = async (req, res) => {
  const { id } = await req.params
  if (!id) return res.sendStatus(400)
  try {
    const result = await Message.findByIdAndDelete(id)
    if (!result) return res.sendStatus(500)
    res.sendStatus(200).json({ messageDeleted: id })
  }
  catch (err) { res.sendStatus(500) }
}



module.exports = { getMessage, getGMessage, deleteMessage };
