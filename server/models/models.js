const { string, required } = require('joi')
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
    sender: { type: String, require: [true, "Please enter username"] },
    message: { type: String, require: [true, "Please enter message"] },
    receiver: { type: String, require: [true, "Please enter message"] },
    timestamp: { type: Date, default: Date.now }
})


const User = mongoose.model("users", userSchema)
const Tokens = mongoose.model("tokens", tokenSchema)
const Message = mongoose.model("messages", messageSchema)

module.exports = { User, Tokens, Message };