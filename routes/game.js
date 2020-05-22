const express = require('express');
const router = express.Router();
const Game = require('../models/game');
const ActivePlayers = require('../models/activePlayers');

router.get('/getAllRooms', (req, res) => { 
    Game.find({}, (err, data) =>{
        if(err){
            console.log(err);
        }else{
            res.send(data);
        }
    });
});

router.get('/getRoom', (req, res) => { 
    Game.find({roomid: req.query.id}, (err, data) =>{
        if(err){
            console.log(err);
        }else{
            res.send(data);
        }
    });
});

router.get('/getPlayers', (req, res) => { 
    ActivePlayers.find({roomKey: req.query.id}, (err, data) =>{
        if(err){
            console.log(err);
        }else{
            res.send(data);
        }
    });
});

module.exports = router;