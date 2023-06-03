const mongoose = require('mongoose')

// Schema user
const userSchema = mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String
})

const userModel = mongoose.model('user', userSchema)

module.exports = userModel 