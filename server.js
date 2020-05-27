const express = require('express');
const app = express();
var http = require('http').Server(app);
const bodyParser = require('body-parser');
const dbConnection = require('./db');
const passport = require('./passportConfig');
const PORT = process.env.PORT || 3001;
const io = require("socket.io")(http);
const path = require('path');
const morgan = require('morgan');
const user = require('./routes/user');
const game = require('./routes/game');
const controller = require('./controller/gameController');

io.listen(3002);
app.set('socket-io', io);
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(bodyParser.json());
//Passport
app.use(passport.initialize());
app.use(passport.session());
//middleware
app.use(morgan('dev'));
//user login/signup actions
app.use(user);
//lobby, game and socket actions
app.use(game);

io.of('/lobby').on('connection', (socket)=>{ 
	console.log('connected to lobby');
	io.sockets.emit('listRooms');
});   
io.of('/game').on('connection', (socket)=>{ 
	console.log('connected to game server');
	socket.on('join', (rid, username) =>{
		socket.join(rid);
		socket.username = username;
		socket.room = rid;
		controller.joinSocket(rid, io, socket.id);
	});
	socket.on('getTurn', (rid) =>{
		controller.getTurn(rid.toString(), io);
	});
	socket.on('nextTurn', async (info) =>{
        controller.getNextTurn(info, io)
	});
	socket.on('drawCard', (roomID, pack) =>{
		controller.drawCard(roomID, pack, io);
	});
	socket.on('flipCard', (info) =>{
		controller.flipCard(info, io);
	});
	socket.on('swapCard', (info, card) =>{
		controller.swapCard(info, card, io);
	});
	socket.on('scan', (info) =>{
		controller.check(info, io);
	});
	socket.on('rematch', (roomid) =>{
		controller.rematch(roomid, io);
	});
	socket.on('onMessage', (info, body)=>{        
		controller.handleMessage(info, body, io);
    });
	socket.on('disconnect', () =>{
		controller.disconnectPlayer(socket.room, socket.username, io, socket);
	});
});  

if (process.env.NODE_ENV === 'production') {
	app.use(express.static(path.resolve(__dirname, '/app','my-app', 'build')));
	app.get('*', (req, res) => {
	  res.sendFile(path.resolve(__dirname, '/app', 'my-app', 'build', 'index.html'));
	});
}

http.listen(PORT, () => {
	console.log(`App listening on PORT: ${PORT}`);
});