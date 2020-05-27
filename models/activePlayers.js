const mongoose = require("mongoose");
const Schema = mongoose.Schema;
mongoose.promise = Promise;

const activePlayersSchema = new Schema({
    id: {type: String, unique: true, required: true}, 
	name: String, 
    hand: Array, 
	cards: Array,
    roomKey: String,
    score: Number
});

let activeplayers = mongoose.model('Activeplayers', activePlayersSchema);

module.exports = activeplayers;