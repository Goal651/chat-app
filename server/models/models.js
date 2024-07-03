const { Timestamp } = require('mongodb')
const mongoose = require('mongoose')

const userSchema = mongoose.Schema(
    {
        username: { type: String, require: [true, "Please enter username"] },
        email: { type: String, require: [true, "please enter email"] },
        password: { type: String, require: [true, "please enter your password"] },
        image: { type: String, required: [true, "please upload image"] },
        createdAt: { type: Date, default: Date.now }
    },
    {
        timestamps: true
    }
)

const tokenSchema = mongoose.Schema(
    {
        email: { type: String, require: [true, "please enter email"] },
        accessToken: { type: String, require: [true, "please enter your password"] },
        createdAt: { type: Date, default: Date.now }
    },
    {
        timestamps: true
    }
)

const messageSchema = mongoose.Schema({
    sender: { type: String, require: true },
    message: { type: String, require: true },
    receiver: { type: String, require: true },
    timestamp: { type: Date, default: Date.now }
})


const groupMessageSchema = mongoose.Schema({
    sender: { type: String, require: true },
    message: { type: String, require: true },
    group: { type: String, require: true },
    timestamp: { type: Date, default: Date.now }
})

const groupSchema = mongoose.Schema(
    {
        name: { type: String, require: true },
        admin: { type: String, require: true },
        image: { type: String },
        createdAt: { type: Date, default: Date.now }
    },
    {
        timestamps: true
    }
)



const User = mongoose.model("users", userSchema)
const Tokens = mongoose.model("tokens", tokenSchema)
const Message = mongoose.model("messages", messageSchema)
const GMessage=mongoose.model('GMessage',groupMessageSchema)
const Group = mongoose.model('groups', groupSchema)

module.exports = { User, Tokens, Message, Group ,GMessage};