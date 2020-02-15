const express = require('express');
const app = express();
var http = require('http').Server(app);
const bodyParser = require('body-parser');
const dbConnection = require('./db');
const passport = require('./passportConfig');
const PORT = process.env.PORT || 3001;
const { MongoClient } = require('mongodb');
const config = require('./config/config');
const url = process.env.MONGODB_URI || `${config.host}`;
const client = new MongoClient(url);
const io = require("socket.io")(http);
const socketHandler = require('./sockets/socketHandler');
const mongoData = require('./db/MongoData');
const path = require('path');
const user = require('./routes/user');
const cardTheme = require('./routes/theme');

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(bodyParser.json());

if (process.env.NODE_ENV === 'production') {
	app.use(express.static(path.resolve(__dirname, '/app','my-app', 'build')));
	app.get('*', (req, res) => {
	  res.sendFile(path.resolve(__dirname, '/app', 'my-app', 'build', 'index.html'));
	});
}
//Passport
app.use(passport.initialize());
app.use(passport.session());

//user login/signup actions
app.use(user);
app.use(cardTheme);

client.connect(function (err){
	//lobby, game and socket actions
	io.on('connection', (socket) =>{ 
	   console.log("New client connected " + socket.id);
	   socketHandler.createRoom(socket, io);
	   socketHandler.joinRoom(socket, io);
	   socketHandler.playerJoined(socket, io);
	   socketHandler.getTurn(socket, io);
	   socketHandler.nextTurn(socket, io);
	   socketHandler.drawCard(socket, io);
	   socketHandler.flipCard(socket, io);
	   socketHandler.swapCard(socket, io);
	   socketHandler.scanPlayerHands(socket, io);
	   socketHandler.sendMessage(socket, io);
	   socketHandler.rematch(socket, io);
	   socketHandler.disconnect(socket, io);
	   mongoData.listRoom(client.db(config.directory), io);
	   mongoData.listRanks(client.db(config.directory), io);
	});
});

http.listen(PORT, () => {
	console.log(`App listening on PORT: ${PORT}`);
});