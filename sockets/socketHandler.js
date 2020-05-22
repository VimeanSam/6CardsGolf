const database = require('../controller/database');
var game = require('../gameLogic/game');
const Game = require('../models/game');
const ActivePlayers = require('../models/activePlayers');

module.exports.roomList = (io) => {
    database.listRoom(io);
}

module.exports.rankList = (io) => {
    database.ranking(io);
}

module.exports.createRoom = (socket, io) => {
    socket.on('createRoom', async (name, id, creator, theme) =>{
        let players = await ActivePlayers.find({name: creator});
        if(players.length === 0){
            socket.join(id.toString());
            database.insertRoom({roomid: id, name: name, creator: creator, cardTheme: theme, occupancy: io.nsps['/'].adapter.rooms[id.toString()].length}, io);
        }
    });
}

module.exports.joinRoom = (socket, io) =>{
    socket.on('joinRoom', async (id, user) => {
        let players = await ActivePlayers.find({name: user});
        let sessions = await Game.find({roomid: id});
        let lowcard = false;
        if(sessions.length > 0){
            if(sessions[0].deck.length < 6){
                lowcard = true;
            }
        }
        if(players.length === 0){
            if(!lowcard){
                socket.join(id.toString());
                database.updateRoom(id, io.nsps['/'].adapter.rooms[id.toString()].length, io);
            }          
        }
    });
}

module.exports.playerJoined = (socket, io) =>{
    socket.once('playerJoined', async (name, id) =>{
        let players = await ActivePlayers.find({name: name});
        let sessions = await Game.find({roomid: id});
        let lowcard = false;
        let found = false;
        if(sessions.length > 0){
            found = true;
            if(sessions[0].deck.length < 6){
                lowcard = true;
            }
        }
        if(players.length === 0){
            if(found && !lowcard){
                database.insertPlayer(id, socket.id, name, io);
                socket.join(id.toString());
                console.log(name+ ' joined');
                database.updateRoom(id, io.nsps['/'].adapter.rooms[id.toString()].length, io);
            }   
        }
    });
}

module.exports.getTurn = (socket, io) =>{
    socket.on('getTurn', async (id) =>{
        let sessions = await Game.find({roomid: id});
        if(sessions.length > 0){
            let tidx = sessions[0].turnIndex;
            database.updateTurnIndex(id, tidx, io);
        }
    });
}

module.exports.nextTurn = (socket, io) =>{
    socket.on('nextTurn', async (info) =>{
        let bar = info.toString().indexOf('|');
        let slash = info.toString().indexOf('/');
        let roomID = info.substring(bar+1, slash);
        let sessions = await Game.find({roomid: roomID});
        let currentTurn = sessions[0].turnIndex+1;;
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
        database.updateRoomDeck(roomID, pack, io);
        io.in(roomID.toString()).emit('drawedPile', burnedCard[0].toString());
    });
}

module.exports.flipCard = (socket, io) =>{
    socket.on('flipCard', async (info, numPlayers)=>{
        let equal = info.toString().indexOf('=');
        let bar = info.toString().indexOf('|');
        let slash = info.toString().indexOf('/');
        let roomID = info.substring(bar+1, slash);
        let userID = info.substring(equal+1, bar);
        let players = await ActivePlayers.find({id: userID});
        let sessions = await Game.find({roomid: roomID});
        let hand = players[0].hand.slice();
        let deck = players[0].cards.slice();
        let cardidx = info[info.length-1];
        deck[cardidx] = hand[cardidx];
        let points = game.getScore(deck);
        database.updatePlayerSession(roomID, userID, deck, hand, points, io);
        if(!deck.includes('x')){
            database.updatePlayersDone(roomID, sessions[0].playersDone+1, io);
            let updatedPlayers = await Promise.resolve(ActivePlayers.find({roomKey: roomID}));
            let updatedSessions = await Promise.resolve(Game.find({roomid: roomID}));
            let scores = [];
            var winners = [];
            var winnerNames = '';
            let deck = [];
            if(updatedSessions[0].playersDone === numPlayers){
                for (let i = 0; i < updatedPlayers.length; i++) {
                    scores = [...scores, updatedPlayers[i].score]
                }
                let minPoint = Math.min(...scores);
                for (var key in updatedPlayers) {
                    if (updatedPlayers.hasOwnProperty(key)) {
                      if(updatedPlayers[key].score === minPoint){
                        winners.push(updatedPlayers[key].name);
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
                if(updatedSessions[0].winners === ''){
                    io.in(roomID.toString()).emit('gameOver', true, winnerNames);
                    database.updatePlayerWins(winnerNames, roomID, io);
                }        
            }
            if(updatedSessions[0].playersDone < numPlayers){
                let nextTurn = updatedSessions[0].turnIndex+1;
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

module.exports.swapCard = (socket, io) =>{
    socket.on('swapCard', async (info, card)=>{
        let equal = info.toString().indexOf('=');
        let bar = info.toString().indexOf('|');
        let slash = info.toString().indexOf('/');
        let roomID = info.substring(bar+1, slash);
        let userID = info.substring(equal+1, bar);
        let players = await Promise.resolve(ActivePlayers.find({id: userID}));
        let sessions = await Promise.resolve(Game.find({roomid: roomID}));
        let hand = players[0].hand.slice();
        let deck = players[0].cards.slice();
        let cardidx = info[info.length-1];
        let burnedCard = hand[cardidx].toString();
        hand[cardidx] = card;
        deck[cardidx] = card;
        let points = game.getScore(deck);
        database.updatePlayerSession(roomID, userID, deck, hand, points, io);
        if(!deck.includes('x')){
            database.updatePlayersDone(roomID, sessions[0].playersDone+1, io);
            if(io.nsps['/'].adapter.rooms[roomID.toString()].length == 1){
                if(sessions[0].winners === ''){
                    io.in(roomID.toString()).emit('gameOver', true, players[0].name);
                    database.updatePlayerWins(players[0].name, roomID, io);
                }        
            }
            io.in(roomID.toString()).emit('endGame', true);
        }
        io.in(roomID.toString()).emit('swap', burnedCard);
    });
}

module.exports.scanPlayerHands = (socket, io) =>{
    socket.on('scanPlayerHands', async (info, numPlayers)=>{
        let equal = info.toString().indexOf('=');
        let bar = info.toString().indexOf('|');
        let slash = info.toString().indexOf('/');
        let userID = info.substring(equal+1, bar);
        let roomID = info.substring(bar+1, slash);
        let players = await Promise.resolve(ActivePlayers.find({roomKey: roomID}));
        let sessions = await Promise.resolve(Game.find({roomid: roomID}));
        let scores = [];
        var winners = [];
        var winnerNames = '';
        let deck = [];
        for (let i = 0; i < players.length; i++) {
            if(players[i].id === userID){
                deck = players[i].cards
                //console.log(players[i].cards);
            }
            scores = [...scores, players[i].score]
        }
        if(!game.deckScan(deck)){
            if(sessions[0].playersDone === numPlayers){
                let minPoint = Math.min(...scores);
                for (var key in players) {
                    if (players.hasOwnProperty(key)) {
                      if(players[key].score === minPoint){
                        winners.push(players[key].name);
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
                if(sessions[0].winners === ''){
                    io.in(roomID.toString()).emit('gameOver', true, winnerNames);
                    database.updatePlayerWins(winnerNames, roomID, io);
                }        
            }
            if(sessions[0].playersDone < numPlayers){
                let nextTurn = sessions[0].turnIndex+1;
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
        database.updateRoomMessage(roomID, messageString, io);
    });
}

module.exports.rematch = (socket, io) =>{
    socket.on('rematch', (roomid)=>{
        database.rematchSession(roomid, io);
    });
}

module.exports.disconnect = (socket, io) => {
    socket.on('disconnect', async () => {
        let playerLists = await ActivePlayers.find({id: socket.id});
        //let playerArr = [];
        let scores = [];
        var winners = [];
        var winnerNames = '';
        if(playerLists.length > 0){
            var playerName = playerLists[0].name;
            var targetID = playerLists[0].roomKey;
            socket.leave(targetID.toString());
            console.log(playerName+' disconnected');
            let playerArr = await ActivePlayers.find({roomKey: targetID.toString()});;
            let sessions = await Game.find({roomid: targetID});
            for (var key in playerArr) {
                if (playerArr.hasOwnProperty(key)) {
                    scores = [...scores, playerArr[key].score];
                }
            }
            var disconnectedIndex = playerArr.map((data)=> {return data.name;}).indexOf(playerName); 
            if(!game.deckScan(playerArr[disconnectedIndex].cards)){
                database.updatePlayersDone(targetID, sessions[0].playersDone-1, io);
                io.in(targetID.toString()).emit('playerDoneDisconnect', sessions[0].playersDone);              
            }
            let deck = sessions[0].deck;
            deck = deck.concat(playerLists[0].hand);
            database.updateRoomDeck(targetID.toString(), deck, io);
            io.in(targetID.toString()).emit('updateDeck', sessions[0].deck);
            if(!io.nsps['/'].adapter.rooms[targetID.toString()]){
                database.deleteCollection(targetID, io);
                database.deletePlayer(socket.id, playerName, targetID, io);
            }else{
                database.updateRoom(targetID, io.nsps['/'].adapter.rooms[targetID.toString()].length, io);
                database.deletePlayer(socket.id, playerName, targetID, io);
                if(sessions[0].turnIndex === disconnectedIndex){
                    if(disconnectedIndex === playerArr.length-1 || disconnectedIndex === 0){
                        database.updateTurnIndex(targetID, 0, io);
                    }else{
                        database.updateTurnIndex(targetID, sessions[0].turnIndex, io);
                    }
                }
                if(sessions[0].turnIndex > disconnectedIndex){
                    let curr_idx = sessions[0].turnIndex-1;
                    database.updateTurnIndex(targetID, curr_idx, io);
                }
                if(io.nsps['/'].adapter.rooms[targetID.toString()].length === sessions[0].playersDone){
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
                    if(sessions[0].winners === ''){
                        io.in(targetID.toString()).emit('gameOver', true, winnerNames);
                        database.updatePlayerWins(winnerNames, targetID, io);
                    }
                }
            }
        }
    });
}