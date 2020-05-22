const express = require('express');
const app = express();
var http = require('http').Server(app);
const bodyParser = require('body-parser');
const dbConnection = require('./db');
const passport = require('./passportConfig');
const PORT = process.env.PORT || 3001;
const io = require("socket.io")(http);
const socketHandler = require('./sockets/socketHandler');
const path = require('path');
const user = require('./routes/user');
const game = require('./routes/game');

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
//lobby, game and socket actions
app.use(game);
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
	socketHandler.roomList(io);
	socketHandler.rankList(io);
});

http.listen(PORT, () => {
	console.log(`App listening on PORT: ${PORT}`);
});