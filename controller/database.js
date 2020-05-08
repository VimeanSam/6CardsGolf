var RoomLists = {};
var players = {};
var gameRooms = {};
const mongoData = require('../db/MongoData');
var game = require('../gameLogic/game');
//shuffle game deck
var deck = game.shufflePack(game.getDeck());

module.exports.ranking = (io) => {
    mongoData.listRanks(io);
}
module.exports.listRoom = (io) => {
    let rooms = [];
    for(var keys in RoomLists){
        rooms.push(RoomLists[keys])
    }
    io.sockets.emit('listRooms', rooms);
}
module.exports.insertRoom = (data, io) => {
    let rooms = [];
    RoomLists[data.roomid] = data;
    for(var keys in RoomLists){
        rooms.push(RoomLists[keys])
    }
    io.sockets.emit('listRooms', rooms);
}
module.exports.updateRoom = (id, len, io) => {
    if(RoomLists[id]){
        RoomLists[id].occupancy = len;
    }else{
        io.sockets.emit('clearID', id);
    }
    let rooms = [];
    for(var keys in RoomLists){
        rooms.push(RoomLists[keys])
    }
    io.sockets.emit('listRooms', rooms);
    io.in(id.toString()).emit('getTheme', RoomLists[id].cardTheme);
}
module.exports.clearRoomID = (id, io) => {
    io.sockets.emit('clearID', id);
}
module.exports.insertPlayer = (id, socketID, name, io) => {
    const pack = game.shufflePack(gameRooms[id].deck.slice());
    let playerHand = game.draw(pack, 6, '', true);
    var data = {id: socketID, name: name, hand: playerHand, cards: ['x', 'x', 'x', 'x', 'x', 'x'], roomKey: id, score: 0};
    players[socketID] = data;
    gameRooms[id].deck = pack;
    
    let currentRoomPlayers = [];
    for(var key in players){
        if(players[key].roomKey == id){
            currentRoomPlayers.push(players[key]);
        }
    }
    //console.log(currentRoomPlayers);
    io.in(id.toString()).emit('getPlayers', currentRoomPlayers);
}
module.exports.rematchSession = (roomID, io) => {
    const pack = game.shufflePack(deck.slice());
    gameRooms[roomID].turnIndex = 0;
    gameRooms[roomID].playersDone = 0;
    gameRooms[roomID].winners = '';
    let currentRoomPlayers = [];
    for (var key in players) {
        if (players.hasOwnProperty(key)) {
            if(players[key].roomKey === roomID){
                players[key].hand = game.draw(pack, 6, '', true);
                players[key].cards = ['x', 'x', 'x', 'x', 'x', 'x'];
                players[key].score = 0;
                currentRoomPlayers.push(players[key]);
            }
        }
    }
    //console.log(currentRoomPlayers);
    io.in(roomID.toString()).emit('getPlayers', currentRoomPlayers);
    gameRooms[roomID].deck = pack;
    RoomLists[roomID].playersDone = 0;
    let rooms = [];
    for(var keys in RoomLists){
        rooms.push(RoomLists[keys])
    }
    io.sockets.emit('listRooms', rooms);
}
module.exports.updatePlayerSession = (id, socketId, pack, hand, point, io) => {
    players[socketId].cards = pack;
    players[socketId].hand = hand;
    players[socketId].score = point;

    let currentRoomPlayers = [];
    for(var key in players){
        if(players[key].roomKey == id){
            currentRoomPlayers.push(players[key]);
        }
    }
    //console.log(currentRoomPlayers);
    io.in(id.toString()).emit('getPlayers', currentRoomPlayers);
}
module.exports.deletePlayer = (socketID, name, id, io) => {
    delete players[socketID];
    let currentRoomPlayers = [];
    for(var key in players){
        if(players[key].roomKey == id){
            currentRoomPlayers.push(players[key]);
        }
    }
    //console.log(currentRoomPlayers);
    io.in(id.toString()).emit('getPlayers', currentRoomPlayers);
    io.sockets.emit('clear', name);
}
module.exports.deleteCollection = (id, io) => {
    delete RoomLists[id];
    let rooms = [];
    for(var keys in RoomLists){
        rooms.push(RoomLists[keys])
    }
    io.sockets.emit('listRooms', rooms);
}
module.exports.insertGame = (id) => {
    if(gameRooms[id] === undefined){
        gameRooms[id] = {deck: deck, turnIndex: 0, playersDone: 0, messages: [], winners: ''};
    }
}
module.exports.updateRoomDeck = (id, pack) => {
    gameRooms[id].deck = pack;
}
module.exports.updateTurnIndex = (id, idx, io) => {
    gameRooms[id].turnIndex = idx;
    let currentRoomPlayers = [];
    for(var key in players){
        if(players[key].roomKey == id){
            currentRoomPlayers.push(players[key]);
        }
    }
    if(currentRoomPlayers.length > 1){
        io.to(`${currentRoomPlayers[idx].id}`).emit('enableMove', currentRoomPlayers[idx].id);
        //console.log(currentRoomPlayers[idx].name+`'s turn`)
    }
}
module.exports.updatePlayersDone = (id, amt, io) => {
    //console.log('amt: '+amt)
    gameRooms[id].playersDone = amt;
    RoomLists[id].playersDone = amt;
    let rooms = [];
    for(var keys in RoomLists){
        rooms.push(RoomLists[keys])
    }
    //console.log(rooms)
    io.sockets.emit('listRooms', rooms);
}
module.exports.updateRoomMessage = (id, messages) => {
    gameRooms[id].messages = [...gameRooms[id].messages, messages];
}
module.exports.updatePlayerWins = (winners, id, io) => {
    gameRooms[id].winners = winners;
    mongoData.incrementWins(winners, io);
}
module.exports.getGameSessions = () => {
    return gameRooms;
}
module.exports.getPlayers = () => {
    return players;
}
module.exports.getRooms = () => {
    return RoomLists;
}