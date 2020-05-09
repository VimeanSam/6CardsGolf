const database = require('../controller/database');
var sessions = database.getGameSessions();
var players = database.getPlayers();
var game = require('../gameLogic/game');

module.exports.roomList = (io) => {
    database.listRoom(io);
}

module.exports.rankList = (io) => {
    database.ranking(io);
}

module.exports.createRoom = (socket, io) => {
    socket.on('createRoom', (name, id, creator, theme) =>{
        socket.join(id.toString());
        database.insertRoom({roomid: id, name: name, creator: creator, cardTheme: theme, playersDone: 0, occupancy: io.nsps['/'].adapter.rooms[id.toString()].length}, io);
    });
}

module.exports.joinRoom = (socket, io) =>{
    socket.on('joinRoom', (id, user) => {
        let duplicate = false;
        for (var key in players) {
            if (players.hasOwnProperty(key)) {
                if(players[key].name === user){
                    duplicate = true;
                }
            }
        }
        if(!duplicate){
            socket.join(id.toString());
            database.updateRoom(id, io.nsps['/'].adapter.rooms[id.toString()].length, io);
        }
    });
}

module.exports.playerJoined = (socket, io) =>{
    socket.once('playerJoined', (name, id) =>{
        let duplicate = false;
        for (var key in players) {
            if (players.hasOwnProperty(key)) {
                if(players[key].name === name){
                    duplicate = true;
                }
            }
        }
        if(!duplicate){
            if(database.getRooms()[id]){
                database.insertGame(id);
                database.insertPlayer(id, socket.id, name, io);
                socket.join(id.toString());
                console.log(name+ ' joined');
                database.updateRoom(id, io.nsps['/'].adapter.rooms[id.toString()].length, io);
                io.in(id.toString()).emit('updateDeck', sessions[id].deck);
                io.in(id.toString()).emit('messages', sessions[id].messages);
            }else{
                console.log('HERE');
                database.clearRoomID(id, io);
            }
        }
    });
}

module.exports.getTurn = (socket, io) =>{
    socket.on('getTurn', (id) =>{
        if(sessions[id]){
            database.updateTurnIndex(id, sessions[id].turnIndex, io);
        }
    });
}

module.exports.nextTurn = (socket, io) =>{
    socket.on('nextTurn', (info) =>{
        let bar = info.toString().indexOf('|');
        let slash = info.toString().indexOf('/');
        let roomID = info.substring(bar+1, slash);
        let currentTurn = sessions[roomID].turnIndex+1;
        if(currentTurn >= io.nsps['/'].adapter.rooms[roomID.toString()].length){
            if(io.nsps['/'].adapter.rooms[roomID.toString()].length === 1){
                currentTurn = 1;
            }else{
                currentTurn = 0;
            }
        }
        database.updateTurnIndex(roomID, currentTurn, io);
    });
}

module.exports.drawCard = (socket, io) =>{
    socket.on('drawCard', (roomID, pack)=>{
        let burnedCard = game.draw(pack, 1, '', true);
        database.updateRoomDeck(roomID, pack);
        io.in(roomID.toString()).emit('updateDeck', pack);
        io.in(roomID.toString()).emit('drawedPile', burnedCard[0].toString());
    });
}

module.exports.flipCard = (socket, io) =>{
    socket.on('flipCard', (info)=>{
        let equal = info.toString().indexOf('=');
        let bar = info.toString().indexOf('|');
        let slash = info.toString().indexOf('/');
        let roomID = info.substring(bar+1, slash);
        let userID = info.substring(equal+1, bar);
        let hand = players[userID].hand.slice();
        let deck = players[userID].cards.slice();
        let cardidx = info[info.length-1];
        deck[cardidx] = hand[cardidx];
        let points = game.getScore(deck);
        database.updatePlayerSession(roomID, userID, deck, hand, points, io);
        if(!players[userID].cards.includes('x')){
            database.updatePlayersDone(roomID, sessions[roomID].playersDone+1, io);
        }
    });
}

module.exports.swapCard = (socket, io) =>{
    socket.on('swapCard', (info, card)=>{
        let equal = info.toString().indexOf('=');
        let bar = info.toString().indexOf('|');
        let slash = info.toString().indexOf('/');
        let roomID = info.substring(bar+1, slash);
        let userID = info.substring(equal+1, bar);
        let hand = players[userID].hand.slice();
        let deck = players[userID].cards.slice();
        let cardidx = info[info.length-1];
        let burnedCard = hand[cardidx].toString();
        hand[cardidx] = card;
        deck[cardidx] = card;
        let points = game.getScore(deck);
        database.updatePlayerSession(roomID, userID, deck, hand, points, io);
        if(!players[userID].cards.includes('x')){
            database.updatePlayersDone(roomID, sessions[roomID].playersDone+1, io);
            if(io.nsps['/'].adapter.rooms[roomID.toString()].length == 1){
                if(sessions[roomID].winners === ''){
                    io.in(roomID.toString()).emit('gameOver', true, players[userID].name);
                    database.updatePlayerWins(players[userID].name, roomID, io);
                }        
            }
            io.in(roomID.toString()).emit('endGame', true);
        }
        io.in(roomID.toString()).emit('swap', burnedCard);
    });
}

module.exports.scanPlayerHands = (socket, io) =>{
    socket.on('scanPlayerHands', (info, numPlayers)=>{
        let equal = info.toString().indexOf('=');
        let bar = info.toString().indexOf('|');
        let slash = info.toString().indexOf('/');
        let userID = info.substring(equal+1, bar);
        let roomID = info.substring(bar+1, slash);
        let playerArr = [];
        let scores = [];
        var winners = [];
        var winnerNames = '';
        for (var key in players) {
            if (players.hasOwnProperty(key)) {
                if(players[key].roomKey === roomID){
                    playerArr = [...playerArr, players[key]];
                    scores = [...scores, players[key].score]
                }
            }
        }
        if(!game.deckScan(players[userID].cards)){
            if(sessions[roomID].playersDone === numPlayers){
                let minPoint = Math.min(...scores);
                for (var key in playerArr) {
                    if (playerArr.hasOwnProperty(key)) {
                      if(playerArr[key].score === minPoint){
                        winners.push(playerArr[key].name);
                      }
                    }
                }
                for(var i = 0; i < winners.length; i++){
                    if(i === 0){
                        winnerNames = winners[i];
                    }else{
                        winnerNames = winnerNames+', '+winners[i];
                    }
                }
                if(sessions[roomID].winners === ''){
                    io.in(roomID.toString()).emit('gameOver', true, winnerNames);
                    database.updatePlayerWins(winnerNames, roomID, io);
                }        
            }
            if(sessions[roomID].playersDone < numPlayers){
                let nextTurn = sessions[roomID].turnIndex+1;
                if(nextTurn >= io.nsps['/'].adapter.rooms[roomID.toString()].length){
                    if(io.nsps['/'].adapter.rooms[roomID.toString()].length === 1){
                        nextTurn = 1;
                    }else{
                        nextTurn = 0;
                    }
                }
                //console.log('IN HERE');
                io.in(roomID.toString()).emit('rotate');
                database.updateTurnIndex(roomID, nextTurn, io);
            }
        }    
    });
}

module.exports.sendMessage = (socket, io) =>{
    socket.on('sendMessage', (info, body)=>{
        let bar = info.toString().indexOf('|');
        let slash = info.toString().indexOf('/');
        let username = info.substring(0, bar);
        let roomID = info.substring(bar+1, slash);
        let messageString = {from: username, message: body};
        database.updateRoomMessage(roomID, messageString);
        if(sessions[roomID]){
            io.in(roomID.toString()).emit('messages', sessions[roomID].messages);
        }
    });
}

module.exports.rematch = (socket, io) =>{
    socket.on('rematch', (roomid)=>{
        database.rematchSession(roomid, io);
        io.in(roomid.toString()).emit('updateDeck', sessions[roomid].deck);
        io.in(roomid.toString()).emit('gameOver', false, '');
        io.in(roomid.toString()).emit('drawedPile', 'mystery');
        io.in(roomid.toString()).emit('reset');
    });
}

module.exports.disconnect = (socket, io) => {
    socket.on('disconnect', function(){
        let playerArr = [];
        let scores = [];
        var winners = [];
        var winnerNames = '';
        if(players[socket.id] !== undefined){
            var playerName = players[socket.id].name;
            var targetID = players[socket.id].roomKey;
            socket.leave(targetID.toString());
            console.log(playerName+' disconnected');
            for (var key in players) {
                if (players.hasOwnProperty(key)) {
                    if(players[key].roomKey === targetID){
                        playerArr = [...playerArr, players[key]];
                        scores = [...scores, players[key].score];
                    }
                }
            }
            var disconnectedIndex = playerArr.map((data)=> {return data.name;}).indexOf(playerName); 
            if(!game.deckScan(playerArr[disconnectedIndex].cards)){
                database.updatePlayersDone(targetID, sessions[targetID].playersDone-1, io);
                io.in(targetID.toString()).emit('playerDoneDisconnect', sessions[targetID].playersDone);              
            }
            database.updateRoomDeck(targetID, game.shufflePack(sessions[targetID].deck.concat(players[socket.id].hand)));
            io.in(targetID.toString()).emit('updateDeck', sessions[targetID].deck);
            if(!io.nsps['/'].adapter.rooms[targetID.toString()]){
                database.deleteCollection(targetID, io);
                database.deletePlayer(socket.id, playerName, targetID, io);
            }else{
                database.updateRoom(targetID, io.nsps['/'].adapter.rooms[targetID.toString()].length, io);
                database.deletePlayer(socket.id, playerName, targetID, io);
                if(sessions[targetID].turnIndex === disconnectedIndex){
                    if(disconnectedIndex === playerArr.length-1 || disconnectedIndex === 0){
                        database.updateTurnIndex(targetID, 0, io);
                    }else{
                        database.updateTurnIndex(targetID, sessions[targetID].turnIndex, io);
                    }
                }
                if(sessions[targetID].turnIndex > disconnectedIndex){
                    let curr_idx = sessions[targetID].turnIndex-1;
                    database.updateTurnIndex(targetID, curr_idx, io);
                }
                if(io.nsps['/'].adapter.rooms[targetID.toString()].length === sessions[targetID].playersDone){
                    //if players do not have their cards flip over and they disconnect with the lowest score, remove their score and find the next lowest. 
                    scores.splice(disconnectedIndex, 1);
                    playerArr.splice(disconnectedIndex, 1);
                    let minPoint = Math.min(...scores);
                    for (var key in playerArr) {
                        if (playerArr.hasOwnProperty(key)) {
                            if(playerArr[key].score === minPoint){
                                winners.push(playerArr[key].name);
                            }
                        }
                    }
                    for(var i = 0; i < winners.length; i++){
                        if(i === 0){
                            winnerNames = winners[i];
                        }else{
                            winnerNames = winnerNames+', '+winners[i];
                        }
                    }
                    if(sessions[targetID].winners === ''){
                        io.in(targetID.toString()).emit('gameOver', true, winnerNames);
                        database.updatePlayerWins(winnerNames, targetID, io);
                    }
                }
            }
        }
    });
}