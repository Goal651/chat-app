const { Timestamp } = require('mongodb');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    image: String,
    username: String,
    names: String,
    lastActiveTime: Date,
    unreads: [{
        sender: String,
        message: String,
        timestamp: Date
    }]
});

const tokenSchema = mongoose.Schema({
    email: String,
    accessToken: String,
    createdAt: { type: Date, default: Date.now },
})

const messageSchema = mongoose.Schema({
    sender: { type: String, require: true },
    message: { type: String, require: true },
    receiver: { type: String, require: true },
    seen: { type: String, require: true },
    type: { type: String, require: true },
    time: { type: String, require: true },
    timestamp: { type: Date, default: Date.now }
})


const groupMessageSchema = mongoose.Schema({
    sender: { type: String, require: true },
    message: { type: String, require: true },
    group: { type: String, require: true },
    seen:[{
        sender: { type: String, require: true },
        timestamp: { type: Date, default: Date.now }
    }],
    type: { type: String, require: true },
    time: { type: String, require: true },
    timestamp: { type: Date, default: Date.now }
});

const groupSchema = mongoose.Schema({
    name: { type: String, require: true },
    admin: { type: String, require: true },
    image: { type: String, require: true },
    createdAt: { type: Date, default: Date.now },
})

const User = mongoose.model("users", userSchema);
const Tokens = mongoose.model("tokens", tokenSchema);
const Message = mongoose.model("messages", messageSchema);
const GMessage = mongoose.model('GMessage', groupMessageSchema);
const Group = mongoose.model('groups', groupSchema);

module.exports = { User, Tokens, Message, Group, GMessage };
