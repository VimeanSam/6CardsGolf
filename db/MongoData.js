const { MongoClient } = require('mongodb');
const config = require('../config/config');
const url = process.env.MONGODB_URI || `${config.host}`;
const client = new MongoClient(url);

client.connect(function (err){
    const db = client.db(config.directory);
    module.exports.incrementWins = (players, io) => {
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
    module.exports.listRanks = (io) => {
        db.collection("users").aggregate([{$sort: {wins: -1}}, {$project : { _id: 0, __v: 0 , email: 0, password: 0}}]).toArray((err, result) => {
            if (err) throw err;
            io.sockets.emit('rankings', result);
        });
    }
});