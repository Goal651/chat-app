const { Message, GMessage, User } = require('../models/models');
const fs = require('fs').promises;
const path = require('path');
const uploadsDir = path.join(__dirname, './');

const getMessage = async (req, res) => {
  try {
    const { receiver } = req.query;
    const sender = req.user;

    if (!sender || !receiver) {
      return res.status(400).json({ message: 'Sender and receiver are required' });
    }

    const messages = await Message.find({
      $or: [
        { sender: sender, receiver: receiver },
        { sender: receiver, receiver: sender }
      ]
    });

    if (messages.length === 0) {
      return res.status(200).json({ messages: null });
    }

    const messageWithDetails = await Promise.all(messages.map(async (message) => {
      let imageData = null;

      if (message.type === 'file') {
        const imagePath = path.join(message.message); // Ensure this path is correct

        try {
          const data = await fs.readFile(imagePath);
          imageData = data.toString('base64');
        } catch (err) {
          console.log(`Error reading image for user ${message.sender}:`, err);
        }
      }

      return {
        ...message._doc, // Copy existing message fields
        image: imageData
      };
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
  if (gmessages.length === 0) return res.status(200).json({ gmessages: null });
  try {

    const gmsWithDetails = await Promise.all(
      gmessages.map(async gm => {
        let imageData = null;
        let senderUsername = ''
        const user = userMap.get(gm.sender);
        if (user && user.image) {
          const imagePath = path.join(uploadsDir, user.image);
          senderUsername = user.username
          try {
            imageData = await fs.readFile(imagePath);
          } catch (err) {
            console.log(`Error reading image for user ${user.email}:`, err);
          }
        }
        return { ...gm._doc, imageData: imageData ? imageData.toString('base64') : null, senderImage: user ? user.image : null, senderUsername };
      })
    );
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
    res.sendStatus(200)
  }
  catch (err) { res.sendStatus(500) }
}



module.exports = { getMessage, getGMessage, deleteMessage };
