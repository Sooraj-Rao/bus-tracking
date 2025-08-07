const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    userName:{
        type: String,
    },
    email:{
        type: String,
        required: true,
    },
    password:{
        type: String,
        required: true,
        minLength: 4
    }
})

module.exports = mongoose.model('User', userSchema)