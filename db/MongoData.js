const { MongoClient } = require('mongodb');
const config = require('../config/config');
const url = process.env.MONGODB_URI || `${config.host}`;
const client = new MongoClient(url);

client.connect(function (err){
    module.exports.listRoom = (db, io) => {
        db.collection("RoomLists").find({}, {projection: {_id: 0}}).toArray(function(err, result) {
            if (err) throw err;
            io.sockets.emit('listRooms', result);
        }); 
    } 
    module.exports.addRoom = (data, io) => {
        const db = client.db(config.directory);
        db.collection("RoomLists").insertOne(data, (err) => {
            if (err) throw err;
            console.log('post to db successful');
            db.collection("RoomLists").find({}, {projection: {_id: 0}}).toArray(function(err, result) {
                if (err) throw err;
                io.sockets.emit('listRooms', result);
            });
        }); 
    }
    module.exports.updateRoom = (target, updater, io) => {
        const db = client.db(config.directory);
        db.collection("RoomLists").updateOne(target, updater, (err) => {
            if (err) throw err;
            console.log("1 document updated");
            db.collection("RoomLists").find({}, {projection: {_id: 0}}).toArray(function(err, result) {
                if (err) throw err;
                io.sockets.emit('listRooms', result);
            });
        });
    }
    module.exports.deleteRoom = (target, io) => {
        const db = client.db(config.directory);
        db.collection("RoomLists").deleteOne(target, (err) => {
            if (err) throw err;
            console.log("1 document Deleted");
            db.collection("RoomLists").find({}, {projection: {_id: 0}}).toArray(function(err, result) {
                if (err) throw err;
                io.sockets.emit('listRooms', result);
            }); 
         });
    }
    module.exports.addSessions = (id, data, io) => {
        const db = client.db(config.directory);
        db.collection(id.toString()).insertOne(data, (err) => {
            if (err) throw err;
            console.log('player joined successfully');
            db.collection(id.toString()).find({}, {projection: {_id: 0}}).toArray((err, result)=> {
                if (err) throw err;
                io.in(id.toString()).emit('getPlayers', result);
            }); 
        }); 
    }
    module.exports.dropSession = (id) => {
        const db = client.db(config.directory);
        db.collection(id.toString()).drop((err, status)=>{
            if (err) throw err;
            if (status) console.log("Collection deleted");
        });
    }
    module.exports.removePlayersFromSessions = (id, data, io) => {
        const db = client.db(config.directory);
        db.collection(id.toString()).deleteOne(data, (err) =>{
            if (err) throw err;
            console.log("1 player deleted");
            db.collection(id.toString()).find({}, {projection: {_id: 0}}).toArray((err, result)=> {
                if (err) throw err;
                io.in(id.toString()).emit('getPlayers', result);
                io.sockets.emit('clear', data.name);
            }); 
        }); 
    }
    module.exports.getTurn = (id, idx, io) => {
        const db = client.db(config.directory);
        db.collection(id.toString()).find({}, {projection: {_id: 0}}).toArray((err, players)=> {
            if (err) throw err;
            if(players.length > 1){
                io.to(`${players[idx].id}`).emit('enableMove', players[idx].id);
                console.log(players[idx].name+`'s turn`)
            }
        });
    }
    module.exports.updatePlayerDeck = (id, target, updater, io) => {
        const db = client.db(config.directory);
        db.collection(id.toString()).updateOne(target, updater,(err) => {
            if (err) throw err;
            console.log("Player deck updated");
            db.collection(id.toString()).find({}, {projection: {_id: 0}}).toArray((err, result)=> {
                if (err) throw err;
                io.in(id.toString()).emit('getPlayers', result);
            });
        });
    }
    module.exports.incrementWins = (players, io) => {
        const db = client.db(config.directory);
        let winners = players.split(", ");
        for(let i = 0; i < winners.length; i++){
            console.log(winners[i]);
            db.collection("users").updateOne({username: winners[i]}, {$inc: {wins: 1}},(err) => {
                if (err) throw err;
                console.log(winners[i]+' +1 win');
                db.collection("users").aggregate([{$sort: {wins: -1}}, {$project : { _id: 0, __v: 0 , email: 0, password: 0}}]).toArray((err, result) => {
                    if (err) throw err;
                    io.sockets.emit('rankings', result);
                });
            });
        }
    }
    module.exports.listRanks = (db, io) => {
        db.collection("users").aggregate([{$sort: {wins: -1}}, {$project : { _id: 0, __v: 0 , email: 0, password: 0}}]).toArray((err, result) => {
            if (err) throw err;
            io.sockets.emit('rankings', result);
        });
    }
    module.exports.clearOut = (id, io) => {
        io.sockets.emit('clearID', id);
    }
});