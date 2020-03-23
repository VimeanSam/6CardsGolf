var RoomLists = {};
var players = {};
var gameRooms = {};
const mongoData = require('../db/MongoData');
var game = require('../gameLogic/game');
//shuffle game deck
var deck = game.shufflePack(game.getDeck());

module.exports.insertRoom = (data, io) => {
    RoomLists[data.roomid] = data;
    mongoData.addRoom(data, io);
}
module.exports.updateRoom = (id, len, io) => {
    if(RoomLists[id]){
        RoomLists[id].occupancy = len;
    }else{
        mongoData.clearOut(id, io);
    }
    //base case: a room must have at least 1 occupant in order for others to join
    var target = {roomid: parseInt(id)};
    var updater = {$set: {occupancy: io.nsps['/'].adapter.rooms[id.toString()].length}};
    mongoData.updateRoom(target, updater, io);
}
module.exports.deleteRoom = (id, io) => {
    var target = {roomid: parseInt(id)};
    mongoData.deleteRoom(target, io);
}
module.exports.clearRoomID = (id, io) => {
    mongoData.clearOut(id, io);
}
module.exports.insertPlayer = (id, socketID, name, io) => {
    const pack = game.shufflePack(gameRooms[id].deck.slice());
    let playerHand = game.draw(pack, 6, '', true);
    var data = {id: socketID, name: name, hand: playerHand, cards: ['x', 'x', 'x', 'x', 'x', 'x'], roomKey: id, score: 0};
    players[socketID] = data;
    gameRooms[id].deck = pack;
    mongoData.addSessions(id, {id: socketID, name: name, cards: ['x', 'x', 'x', 'x', 'x', 'x'], roomKey: id, score: 0}, io);
}
module.exports.rematchSession = (roomID, io) => {
    const pack = game.shufflePack(deck.slice());
    gameRooms[roomID].turnIndex = 0;
    gameRooms[roomID].playersDone = 0;
    gameRooms[roomID].winners = '';
    for (var key in players) {
        if (players.hasOwnProperty(key)) {
            if(players[key].roomKey === roomID){
                players[key].hand = game.draw(pack, 6, '', true);
                players[key].cards = ['x', 'x', 'x', 'x', 'x', 'x'];
                mongoData.updatePlayerDeck(roomID, {id: players[key].id}, {$set: {cards: ['x', 'x', 'x', 'x', 'x', 'x'], score: 0}}, io);
            }
        }
    }
    gameRooms[roomID].deck = pack;
    var target = {roomid: parseInt(roomID)};
    var updater = {$set: {playersDone: 0}};
    mongoData.updateRoom(target, updater, io);
}
module.exports.updatePlayerSession = (id, socketId, pack, hand, point, io) => {
    players[socketId].cards = pack;
    players[socketId].hand = hand;
    players[socketId].score = point;
    var target = {id: socketId};
    var updater = {$set: {cards: players[socketId].cards, score: point}};
    mongoData.updatePlayerDeck(id, target, updater, io);
}
module.exports.deletePlayer = (socketID) => {
    delete players[socketID];
}
module.exports.deleteCollection = (id) => {
    delete RoomLists[id];
    mongoData.dropSession(id);
}
module.exports.removeDocument = (id, name, io) => {
    var playerRemoved = {name: name};
    mongoData.removePlayersFromSessions(id, playerRemoved, io);
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
    mongoData.getTurn(id, idx, io);
}
module.exports.updatePlayersDone = (id, amt, io) => {
    gameRooms[id].playersDone = amt;
    var target = {roomid: parseInt(id)};
    var updater = {$set: {playersDone: amt}};
    mongoData.updateRoom(target, updater, io);
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