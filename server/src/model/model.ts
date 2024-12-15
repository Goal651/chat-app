import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { type: String, default: '' },
    username: { type: String, required: true, unique: true },
    names: { type: String, required: true },
    lastActiveTime: { type: Date, default: Date.now },
    groups: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        default: []
    }],
    unreads: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: []
    }],
    latestMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    },
    publicKey: { type: String, required: true },
    privateKey: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const groupSchema = new mongoose.Schema({
    groupName: { type: String, required: true, unique: true },
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    image: { type: String, default: '' },
    members: [{
        member: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: { type: String, default: '' }
    }],
    latestMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GMessage',
        default: null
    },
    aesKey: { type: String, required: true },
    iv: { type: String, required: true },
    encryptedPrivateKey: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, }
});

const tokenSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    accessToken: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: { type: String, required: true, },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    seen: { type: Boolean, default: false },
    edited: { type: Boolean, default: false },
    isMessageSent: { type: Boolean, default: true },
    reactions: [{
        reaction: { type: String, required: true },
        reactor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        default: []
    }],
    replying: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    },
    type: { type: String, required: true },
    time: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const groupMessageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: { type: String, required: true, },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    seen: [{
        member: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        seenAt: { type: Date, default: Date.now }
    }],
    replying: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GMessage',
        default: null
    },
    isMessageSent: { type: Boolean, default: true },
    type: { type: String, required: true },
    time: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);
const Tokens = mongoose.model("Token", tokenSchema);
const Message = mongoose.model("Message", messageSchema);
const Group = mongoose.model("Group", groupSchema);
const GMessage = mongoose.model('GMessage', groupMessageSchema);

export default {
    User,
    Tokens,
    Message,
    Group,
    GMessage
};
