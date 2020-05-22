var gameLogic = require('../gameLogic/game');
const Game = require('../models/game');
const ActivePlayers = require('../models/activePlayers');
const Users = require('../models/player');
//shuffle game deck
var deck = gameLogic.shufflePack(gameLogic.getDeck());

module.exports.ranking = async (io) => {
    let data = await Users.aggregate([{$sort: {wins: -1}}, {$project : { _id: 0, __v: 0 , email: 0, password: 0}}]);
    io.sockets.emit('rankings', data);
}
module.exports.listRoom = (io) => {
    io.sockets.emit('listRooms');
}
module.exports.insertRoom = (data, io) => {
    let pack = gameLogic.shufflePack(deck.slice());
    const newGame = new Game({
        roomid: data.roomid, 
        name: data.name, 
        creator: data.creator, 
        cardTheme: data.cardTheme,
        cardsLeft: 108,
        playersDone: 0,
        occupancy: data.occupancy,
        deck: pack,
        turnIndex: 0,
        winners: '',
        players: [],
        messages: []
    });
    newGame.save((err, savedGame) => {
        if (err) throw err;
    });
    io.sockets.emit('listRooms');
}
module.exports.updateRoom = async (id, len, io) => {
    let RoomLists = await Game.find({roomid: id});
    if(RoomLists.length > 0){
        var target = {roomid: id};
        var updater = {occupancy: len};
        Game.updateOne(target, updater, (err, data) =>{
            if(err) throw err;   
        });
    }else{
        io.sockets.emit('clearID', id);
    }
    io.sockets.emit('listRooms');
    io.in(id.toString()).emit('getTheme');
    io.in(id.toString()).emit('getPlayers');
}
module.exports.clearRoomID = (id, io) => {
    io.sockets.emit('clearID', id);
}
module.exports.insertPlayer = async (id, socketID, name, io) => {
    let room = await Game.find({roomid: id});
    let roomdeck = room[0].deck;
    const pack = gameLogic.shufflePack(roomdeck.slice());
    let playerHand = gameLogic.draw(pack, 6, '', true);
    var data = {id: socketID, name: name, hand: playerHand, cards: ['x', 'x', 'x', 'x', 'x', 'x'], roomKey: id, score: 0};
    const newPlayers = new ActivePlayers(data);
    newPlayers.save((err, data) => {
        if (err) throw err;    
    });
    var target = {roomid: id};
    var updater = {deck: pack, cardsLeft: pack.length};
    Game.updateOne(target, updater, (err, data) =>{
        if(err) throw err;   
    });
    io.in(id.toString()).emit('getPlayers');
    io.in(id.toString()).emit('updateDeck', pack);
    io.in(id.toString()).emit('messages', room[0].messages);
}
module.exports.rematchSession = async (roomID, io) => {
    const pack = gameLogic.shufflePack(deck.slice());
    let players = await ActivePlayers.find({roomKey: roomID});
    for(let i = 0; i < players.length; i++){
        var target = {name: players[i].name};
        var updater = {cards: ['x', 'x', 'x', 'x', 'x', 'x'], hand: gameLogic.draw(pack, 6, '', true), score: 0};
        ActivePlayers.updateOne(target, updater, (err, data) =>{
            if(err) throw err;   
        });
    }
    
    let gameTarget = {roomid: roomID};
    let gameUpdater = {turnIndex: 0, playersDone: 0, winners: '', deck: pack, cardsLeft: pack.length};
    Game.updateOne(gameTarget, gameUpdater, (err, data) =>{
        if(err) throw err;   
    });
    io.sockets.emit('listRooms');
    io.in(roomID.toString()).emit('getPlayers');
    io.in(roomID.toString()).emit('updateDeck', pack);
    io.in(roomID.toString()).emit('gameOver', false, '');
    io.in(roomID.toString()).emit('drawedPile', 'mystery');
    io.in(roomID.toString()).emit('reset');
}
module.exports.updatePlayerSession = async (id, socketId, pack, hand, point, io) => {
    var target = {id: socketId};
    var updater = {cards: pack, hand: hand, score: point};
    await ActivePlayers.updateOne(target, updater, (err, data) =>{
        if(err) throw err;   
    });
    io.in(id.toString()).emit('getPlayers');
}
module.exports.deletePlayer = (socketID, name, id, io) => {
    let target = {id: socketID};
    ActivePlayers.deleteOne(target, (err) =>{
        if(err){
            throw err;
        }else{
            console.log('deleted '+name);
        }
    });
    io.in(id.toString()).emit('getPlayers');
    io.in(id.toString()).emit('test', name);
}
module.exports.deleteCollection = (id, io) => {
    let target = {roomid: id};
    Game.deleteOne(target, (err) =>{
        if(err){
            throw err;
        }else{
            console.log("delete successfully");
        }
    });
    io.sockets.emit('listRooms');
}
module.exports.updateRoomDeck = async (id, pack, io) => {
    //console.log('updateDecK: '+pack.length);
    var target = {roomid: id};
    var updater = {deck: pack, cardsLeft: pack.length};
    await Game.updateOne(target, updater, (err, data) =>{
        if(err) throw err;   
    });
    io.sockets.emit('listRooms');
    io.in(id.toString()).emit('updateDeck', pack);
}
module.exports.updateTurnIndex = async (id, idx, io) => {
    var target = {roomid: id};
    var updater = {turnIndex: idx};
    Game.updateOne(target, updater, (err, data) =>{
        if(err) throw err;   
    });
    let currentRoomPlayers = await ActivePlayers.find({roomKey: id});
    if(currentRoomPlayers.length > 1){
        io.to(`${currentRoomPlayers[idx].id}`).emit('enableMove', currentRoomPlayers[idx].id);
        console.log(currentRoomPlayers[idx].name+`'s turn`);
        var msg = {$push: {messages: {from: 'GAME_SERVER', message: currentRoomPlayers[idx].name+`'s turn`}}};
        Game.updateOne(target, msg, (err, data) =>{
            if(err) throw err;   
        });
        io.in(id.toString()).emit('messages');
    }
}
module.exports.updatePlayersDone = async (id, amt, io) => {
    var target = {roomid: id};
    var updater = {playersDone: amt};
    await Game.updateOne(target, updater, (err, data) =>{
        if(err) throw err;   
    });
    io.sockets.emit('listRooms');
}
module.exports.updateRoomMessage = (id, messages, io) => {
    var target = {roomid: id};
    var updater = {$push: {messages: messages}};
    Game.updateOne(target, updater, (err, data) =>{
        if(err) throw err;   
    });
    io.in(id.toString()).emit('messages');
}
module.exports.updatePlayerWins = (winners, id, io) => {
    var target = {roomid: id};
    var updater = {winners: winners};
    Game.updateOne(target, updater, (err, data) =>{
        if(err) throw err;   
    });
    let winnerLists = winners.split(", ");
    for(let i = 0; i < winnerLists.length; i++){
        Users.updateOne({username: winnerLists[i]}, {$inc: {wins: 1}}, (err, data) =>{
            if(err) throw err;   
        });
    }
}