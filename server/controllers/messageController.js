const { Message } = require('../models/models')

const getMessage = async (req, res) => {
  const { sender, receiver } = req.query;
  if (!sender && !receiver) return res.status(400).json({ message: 'Email not found' });
  const messages = await Message.find({
    $or: [
      { sender: sender, receiver: receiver },
      { sender: receiver, receiver: sender }
    ]
  });

  if (!messages) return res.status(400).json({ message: 'No messages found' });
  res.status(200).json({ messages })
}
module.exports = { getMessage }