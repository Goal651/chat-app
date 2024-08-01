const { Message, GMessage } = require('../models/models');



const getMessage = async (req, res) => {
  const { sender, receiver } = req.query;
  if (!sender && !receiver) return res.status(400).json({ message: 'Sender and receiver are required' });
  try {
    const messages = await Message.find({ $or: [{ sender: sender, receiver: receiver }, { sender: receiver, receiver: sender }] })
    if (messages.length == 0) return res.status(200).json({messages:null})
    res.status(200).json({ messages });
  } catch (error) { res.status(500) }
}


const getGMessage = async (req, res) => {
  const { group } = req.params;
  if (!group) return res.status(400)
  try {
    const gmessages = await GMessage.find({ group: group });
    if (gmessages.length === 0) return res.status(404)
    res.status(200).json({ gmessages })
  } catch (error) { res.status(500) }
};

module.exports = { getMessage, getGMessage }
