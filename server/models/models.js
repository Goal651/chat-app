const { string } = require('joi')
const { Timestamp } = require('mongodb')
const mongoose = require('mongoose')

const userSchema = mongoose.Schema(
    {
        username: { type: String, require: [true, "Please enter username"] },
        email: { type: String, require: [true, "please enter email"] },
        password: { type: String, require: [true, "please enter your password"] },
        profile: [{ type: mongoose.Schema.Types.ObjectId, ref: "Profile" }],
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
    sender: { type: String, require: [true, "Please enter username"] },
    message: { type: String, require: [true, "Please enter message"] },
    receiver: { type: String, require: [true, "Please enter message"] },
    timestamp: { type: Date, default: Date.now }
})

const imageSchema = mongoose.Schema({
    image: { type: String, require: [true, "Please enter image"] },
    timestamp: { type: Date, default: Date.now }
})

const Profile = mongoose.model("profile", imageSchema)
const User = mongoose.model("users", userSchema)
const Tokens = mongoose.model("tokens", tokenSchema)
const Message = mongoose.model("messages", messageSchema)

module.exports = { User, Tokens, Message, Profile };