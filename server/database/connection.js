const mongoose = require('mongoose')

function RunServer()
{
    try{
        mongoose.connect('mongodb://localhost:27017/bus')
        console.log('Connected to MongoDB successfully')
        }
    catch(error){
        console.log('mongodb not connected')
    }
}
module.exports = RunServer;