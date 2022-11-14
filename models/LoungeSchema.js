const mongoose = require('mongoose')


const loungeSchema = new mongoose.Schema({
    title: {type: String, required: true},
    body: {type: String, required: true},
    author: {type: String, required: true},
    author_id: {type: String, required: true},
    avatar: {type:String, required: true}
}, 
{ timestamps: { createdAt: 'created_at' } })


module.exports = mongoose.model('Lounge', loungeSchema)