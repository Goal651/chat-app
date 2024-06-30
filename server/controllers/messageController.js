const { Message } = require('../models/models');

const getMessage = async (req, res) => {
  const { sender, receiver } = req.query;
  if (!sender && !receiver) return res.status(400).json({ message: 'Sender and receiver are required' });
  try {
    const messages = await Message.find({
      $or: [
        { sender: sender, receiver: receiver },
        { sender: receiver, receiver: sender }
      ]
    });
    if (messages.length === 0) return res.status(404).json({ message: 'No messages found' });
    res.status(200).json({ messages });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getMessage };
