var game = require('../gameLogic/game');
const Game = require('../models/game');
const ActivePlayers = require('../models/activePlayers');
const Users = require('../models/player');
var deck = game.shufflePack(game.getDeck());

module.exports.joinSocket = (rid, io, sid) => {
    io.of('/game').to(rid).emit('updateInfo');
}

module.exports.getTurn = async (rid, io) => {
    let sessions = await Game.find({roomid: rid});
    if(sessions.length > 0){
        let tidx = sessions[0].turnIndex;
        this.updateTurnIndex(rid, tidx, io);
    }
}

module.exports.rematch = async (rid, io) => {
    const pack = game.shufflePack(deck.slice());
    let players = await ActivePlayers.find({roomKey: rid});
    let bulkwriteArr = [];
    for(let i = 0; i < players.length; i++){
        bulkwriteArr.push({
            updateOne: {
            filter: {name: players[i].name}, 
            update: {cards: ['x', 'x', 'x', 'x', 'x', 'x'], hand: game.draw(pack, 6, '', true), score: 0}
        }})
    }
    ActivePlayers.bulkWrite(bulkwriteArr, (err, res) =>{
        if(err) throw err;
    });
    let gameTarget = {roomid: rid};
    let gameUpdater = {turnIndex: 0, playersDone: 0, winners: '', deck: pack, cardsLeft: pack.length};
    Game.updateOne(gameTarget, gameUpdater, (err, data) =>{
        if(err) throw err;   
    });
    io.of('/lobby').emit('listRooms');
    io.of('/game').to(rid).emit('getPlayers'); 
    io.of('/game').to(rid).emit('updateDeck', pack);
    io.of('/game').to(rid).emit('gameOver', false, '');
    io.of('/game').to(rid).emit('drawedPile', 'mystery');
    io.of('/game').to(rid).emit('reset');
}

module.exports.getNextTurn = async (info, io) => {
    let bar = info.toString().indexOf('|');
    let slash = info.toString().indexOf('/');
    let roomID = info.substring(bar+1, slash);
    let sessions = await Game.find({roomid: roomID});
    let currentTurn = sessions[0].turnIndex+1;
    if(currentTurn >= io.nsps['/game'].adapter.rooms[roomID.toString()].length){
        if(io.nsps['/game'].adapter.rooms[roomID.toString()].length === 1){
            currentTurn = 1;
        }else{
            currentTurn = 0;
        }
    }
    this.updateTurnIndex(roomID, currentTurn, io);
}

module.exports.drawCard = async (rid, pack, io) => {
    let burnedCard = game.draw(pack, 1, '', true);
    var target = {roomid: rid};
    var updater = {deck: pack, cardsLeft: pack.length};
    await Game.updateOne(target, updater, (err, data) =>{
        if(err) throw err;   
    });
    io.of('/lobby').emit('listRooms'); 
    io.of('/game').to(rid).emit('drawedPile', burnedCard[0].toString()); 
    io.of('/game').to(rid).emit('updateDeck', pack);  
}

module.exports.flipCard = async (info, io) => {
    let equal = info.toString().indexOf('=');
    let bar = info.toString().indexOf('|');
    let slash = info.toString().indexOf('/');
    let roomID = info.substring(bar+1, slash);
    let userID = info.substring(equal+1, bar);
    let player = await ActivePlayers.find({id: userID, roomKey: roomID});
    let session = await Promise.resolve(Game.find({roomid: roomID}));
    let hand = player[0].hand.slice();
    let deck = player[0].cards.slice();
    let cardidx = info[info.length-1];
    deck[cardidx] = hand[cardidx];
    let points = game.getScore(deck);
    var target = {id: userID};
    var updater = {cards: deck, hand: hand, score: points};
    await ActivePlayers.updateOne(target, updater, (err, data) =>{
        if(err) throw err;   
    });
    io.of('/game').to(roomID).emit('getPlayers'); 
    if(!deck.includes('x')){
        let count = session[0].playersDone+1;
        var targetRoom = {roomid: roomID};
        var updateAmt = {playersDone: count};
        io.of('/lobby').emit('listRooms'); 
        let players = await ActivePlayers.find({roomKey: roomID});
        if(count === session[0].occupancy){
            let scores = [];
            for (let i = 0; i < players.length; i++) {
                scores = [...scores, players[i].score];
            }
            let minPoint = Math.min(...scores);
            let winners = await ActivePlayers.find({roomKey: roomID, score: minPoint});
            let winnerNames = '';
            for(var i = 0; i < winners.length; i++){
                if(i === 0){
                    winnerNames = winners[i].name;
                }else{
                    winnerNames = winnerNames+', '+winners[i].name;
                }
            } 
            if(session[0].winners === ''){
                console.log(winnerNames+' won');
                io.of('/game').to(roomID).emit('gameOver', true, winnerNames);
                updateAmt.winners = winnerNames;
                this.updatePlayerWins(winnerNames, io);
                
            }
        }
        await Game.updateOne(targetRoom, updateAmt, (err, data) =>{
            if(err) throw err;   
        });
        if(count < session[0].occupancy){
            let nextTurn = session[0].turnIndex+1;
            console.log(nextTurn);
            if(nextTurn >= io.nsps['/game'].adapter.rooms[roomID.toString()].length){
                if(io.nsps['/game'].adapter.rooms[roomID.toString()].length === 1){
                    nextTurn = 1;
                }else{
                    nextTurn = 0;
                }
            }
            console.log(nextTurn);
            console.log('IN HERE');
            io.of('/game').to(roomID).emit('rotate');
            this.updateTurnIndex(roomID, nextTurn, io);
        }
    } 
}

module.exports.swapCard = async (info, card, io) => {
    let equal = info.toString().indexOf('=');
    let bar = info.toString().indexOf('|');
    let slash = info.toString().indexOf('/');
    let roomID = info.substring(bar+1, slash);
    let userID = info.substring(equal+1, bar);
    let player = await ActivePlayers.find({id: userID, roomKey: roomID});
    let session = await Promise.resolve(Game.find({roomid: roomID}));
    let hand = player[0].hand.slice();
    let deck = player[0].cards.slice();
    let cardidx = info[info.length-1];
    let burnedCard = hand[cardidx].toString();
    hand[cardidx] = card;
    deck[cardidx] = card;
    let points = game.getScore(deck);
    var target = {id: userID};
    var updater = {cards: deck, hand: hand, score: points};
    await ActivePlayers.updateOne(target, updater, (err, data) =>{
        if(err) throw err;   
    });
    io.of('/game').to(roomID).emit('getPlayers'); 
    if(!deck.includes('x')){
        let count = session[0].playersDone+1;
        var targetRoom = {roomid: roomID};
        var updateAmt = {playersDone: count};
        io.of('/game').to(roomID).emit('endGame', true);
        io.of('/lobby').emit('listRooms'); 
        let players = await ActivePlayers.find({roomKey: roomID});
        if(count === session[0].occupancy){
            let scores = [];
            for (let i = 0; i < players.length; i++) {
                scores = [...scores, players[i].score];
            }
            let minPoint = Math.min(...scores);
            let winners = await ActivePlayers.find({roomKey: roomID, score: minPoint});
            let winnerNames = '';
            for(var i = 0; i < winners.length; i++){
                if(i === 0){
                    winnerNames = winners[i].name;
                }else{
                    winnerNames = winnerNames+', '+winners[i].name;
                }
            } 
            if(session[0].winners === ''){
                console.log(winnerNames+' won');
                io.of('/game').to(roomID).emit('gameOver', true, winnerNames);
                updateAmt.winners = winnerNames;
                this.updatePlayerWins(winnerNames, io);
                
            }
        }
        await Game.updateOne(targetRoom, updateAmt, (err, data) =>{
            if(err) throw err;   
        });
        if(count < session[0].occupancy){
            let nextTurn = session[0].turnIndex+1;
            console.log(nextTurn);
            if(nextTurn >= io.nsps['/game'].adapter.rooms[roomID.toString()].length){
                if(io.nsps['/game'].adapter.rooms[roomID.toString()].length === 1){
                    nextTurn = 1;
                }else{
                    nextTurn = 0;
                }
            }
            console.log(nextTurn);
            console.log('IN HERE');
            io.of('/game').to(roomID).emit('rotate');
            this.updateTurnIndex(roomID, nextTurn, io);
        }
    }
    io.of('/game').to(roomID).emit('swap', burnedCard); 
}

module.exports.updateTurnIndex = async (id, idx, io) =>{
    let currentRoomPlayers = await ActivePlayers.find({roomKey: id});
    if(currentRoomPlayers.length > 1){
        var target = {roomid: id};
        var updater = {turnIndex: idx};
        Game.updateOne(target, updater, (err, data) =>{
            if(err) throw err;   
        });
        console.log(`${currentRoomPlayers[idx].name}'s turn`);
        io.of('/game').to(id).emit('enableMove', idx);
        io.of('/game').to(id).emit('notifyTurn');
    }
}

module.exports.updatePlayerWins = (winners, io) => {
    let winnerLists = winners.split(", ");
    let bulkwriteArr = [];
    for(let i = 0; i < winnerLists.length; i++){
        bulkwriteArr.push({
            updateOne: {
            filter: {username: winnerLists[i]}, 
            update: {$inc: {wins: 1}}
        }})
    }
    Users.bulkWrite(bulkwriteArr, (err, data) =>{
        if(err) throw err;   
    });
}

module.exports.handleMessage = async (info, body, io) => {
    let bar = info.toString().indexOf('|');
    let slash = info.toString().indexOf('/');
    let username = info.substring(0, bar);
    let roomID = info.substring(bar+1, slash);
    let colors = ['red', 'blue', 'rgb(230,149,0)', 'green'];
    let players = await ActivePlayers.find({roomKey: roomID});
    let idx = 0;
    for(let i = 0; i < players.length; i++){
        if(players[i].name === username){
            idx = i;
        }
    }
    let messageString = {from: username, message: body, color: colors[idx]};
    let target = {roomid: roomID};
    let updater = {$push: {messages: messageString}};
    Game.updateOne(target, updater, (err, data) =>{
        if(err) throw err;   
    });
    io.of('/game').to(roomID).emit('receivedMessage');
}

module.exports.disconnectPlayer = async (rid, username, io, socket) => {
    let ptarget = {name: username};
    let currentplayer = await ActivePlayers.find({name: username});
    let scores = [];
    let winnerNames = '';
    if(currentplayer.length > 0){
        var playerName = username;
        var targetID = rid;
        var updater = {};
        socket.leave(targetID.toString());
        console.log(playerName+' disconnected');
        var target = {roomid: targetID};
        let playerArr = await ActivePlayers.find({roomKey: targetID.toString()});
        let sessions = await Game.find({roomid: targetID});
        for (var key in playerArr) {
            if (playerArr.hasOwnProperty(key)) {
                scores = [...scores, playerArr[key].score];
            }
        }

        var disconnectedIndex = playerArr.map((data)=> {return data.name;}).indexOf(playerName); 
        if(!game.deckScan(playerArr[disconnectedIndex].cards)){
            updater.playersDone = sessions[0].playersDone-1; 
            io.of('/game').to(targetID).emit('playerDoneDisconnect', sessions[0].playersDone-1);        
        }
        let deck = sessions[0].deck;
        deck = deck.concat(currentplayer[0].hand);
        updater.deck = deck;
        updater.cardsLeft = deck.length;

        ActivePlayers.deleteOne(ptarget, (err) =>{
            if(err){
                throw err;
            }else{
                console.log('deleted '+username);
            }
        }); 

        if(!io.nsps['/game'].adapter.rooms[targetID.toString()]){
            Game.deleteOne(target, (err) =>{
                if(err){
                    throw err;
                }else{
                    console.log("delete successfully");
                }
            });
        }else{
            updater.occupancy = io.nsps['/game'].adapter.rooms[targetID.toString()].length;
            if(sessions[0].turnIndex === disconnectedIndex){
                if(disconnectedIndex === playerArr.length-1 || disconnectedIndex === 0){
                    //database.updateTurnIndex(targetID, 0, io);
                    this.updateTurnIndex(targetID, 0, io);
                }else{
                    //database.updateTurnIndex(targetID, sessions[0].turnIndex, io);
                    this.updateTurnIndex(targetID, sessions[0].turnIndex, io);
                }
            }
            if(sessions[0].turnIndex > disconnectedIndex){
                let curr_idx = sessions[0].turnIndex-1;
               // database.updateTurnIndex(targetID, curr_idx, io);
                this.updateTurnIndex(targetID, curr_idx, io);
            }
            if(io.nsps['/game'].adapter.rooms[targetID.toString()].length === sessions[0].playersDone){
                //if players do not have their cards flip over and they disconnect with the lowest score, remove their score and find the next lowest. 
                scores.splice(disconnectedIndex, 1);
                let minPoint = Math.min(...scores);
                let winners = await ActivePlayers.find({roomKey: targetID.toString(), score: minPoint});
                for(var i = 0; i < winners.length; i++){
                    if(i === 0){
                        winnerNames = winners[i].name;
                    }else{
                        winnerNames = winnerNames+', '+winners[i].name;
                    }
                }
                console.log(winnerNames+' won');
                if(sessions[0].winners === ''){
                    io.of('/game').to(targetID).emit('gameOver', true, winnerNames);
                    this.updatePlayerWins(winnerNames, io);
                }
            }
        }
        await Game.updateOne(target, updater, (err, data) =>{
            if(err) throw err;   
        });
        io.of('/lobby').emit('listRooms'); 
        io.of('/game').to(targetID).emit('updateDeck', deck); 
        io.of('/game').to(targetID).emit('getPlayers');  
    }
}