const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');
mongoose.promise = Promise;

const playerSchema = new Schema({
	username: { type: String, unique: false, required: false },
	email: { type: String, unique: false, required: false },
	password: { type: String, unique: false, required: false },
	_unhashedBackup: { type: String, unique: false, required: false },
	wins: { type: Number, unique: false, required: false }
});

playerSchema.methods = {
	checkPassword: function (inputPassword) {
		return bcrypt.compareSync(inputPassword, this.password);
	},
	hashPassword: plainTextPassword => {
		return bcrypt.hashSync(plainTextPassword, 10);
	}
}

playerSchema.pre('save', function (next) {
	if (!this.password) {
		next();
	} else {
		this.password = this.hashPassword(this.password)
		next();
	}
});

const Player = mongoose.model('User', playerSchema);
module.exports = Player;