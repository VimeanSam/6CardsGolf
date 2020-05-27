const mongoose = require("mongoose");
const Schema = mongoose.Schema;
mongoose.promise = Promise;

const gameSchema = new Schema({
	roomid: {type: String, unique: true, required: true}, 
	name: String, 
    creator: String, 
	cardTheme: String,
    cardsLeft: Number,
    playersDone: Number,
    occupancy: Number,
    deck: Array,
    turnIndex: Number,
    winners: String,
    messages: Array
});

let games = mongoose.model('Games', gameSchema);

module.exports = games;