const { Timestamp } = require('mongodb');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, index: true, match: /.+\@.+\..+/ },
    password: { type: String, required: true, minlength: 6 },
    image: String,
    username: { type: String, required: true, unique: true, index: true },
    names: String,
    lastActiveTime: { type: Date, default: Date.now },
    groups: [{ type: String, required: true }],
    unreads: [{ sender: String, message: String, timestamp: Date }]
});

const groupSchema = mongoose.Schema({
    name: { type: String, required: true, unique: true },
    admin: { type: String, required: true },
    image: String,
    members: [{ email: String, role: { type: String, default: '' } }],
    createdAt: { type: Date, default: Date.now, index: true }
});

const tokenSchema = mongoose.Schema({
    email: { type: String, required: true, unique: true, index: true },
    accessToken: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const messageSchema = mongoose.Schema({
    sender: { type: String, required: true },
    message: { type: String, required: true, },
    receiver: { type: String, required: true },
    seen: { type: Boolean, default: false },
    type: { type: String, required: true },
    time: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const groupMessageSchema = mongoose.Schema({
    sender: { type: String, required: true },
    message: { type: String, required: true, },
    group: { type: String, required: true },
    seen: [{
        member: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
    }],
    type: { type: String, required: true },
    time: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);
const Tokens = mongoose.model("Token", tokenSchema);
const Message = mongoose.model("Message", messageSchema);
const Group = mongoose.model("Group", groupSchema);
const GMessage = mongoose.model('GMessage', groupMessageSchema);

module.exports = { User, Tokens, Message, Group, GMessage };
