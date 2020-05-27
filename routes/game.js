const express = require('express');
const router = express.Router();
const Game = require('../models/game');
const ActivePlayers = require('../models/activePlayers');
const Users = require('../models/player');
var gameLogic = require('../gameLogic/game');
var deck = gameLogic.shufflePack(gameLogic.getDeck());

router.get('/getAllRooms', (req, res) => { 
    Game.find({}, (err, data) =>{
        if(err){
            console.log(err);
        }else{
            res.send(data);
        }
    });
});

router.post('/createRoom', async (req, res) => { 
    let pack = gameLogic.shufflePack(deck.slice());
    let exist = await ActivePlayers.find({name: req.body.creator});
    const io = req.app.get('socket-io');
    if(exist.length > 0){
        res.status(500).json({
            message: 'user already in a room',
        });
    }else{
        let pid = Date.now().toString()+Math.random().toString(36).substr(2, 9);
        let playerHand = gameLogic.draw(pack, 6, '', true);
        var data = {id: pid, name: req.body.creator, hand: playerHand, cards: ['x', 'x', 'x', 'x', 'x', 'x'], roomKey: req.body.roomid, score: 0};
        const newPlayers = new ActivePlayers(data);
        await newPlayers.save((err, data) => {
            if (err) throw err;   
        });
        const newGame = new Game({
            roomid: req.body.roomid, 
            name: req.body.name, 
            creator: req.body.creator, 
            cardTheme: req.body.cardTheme,
            cardsLeft: pack.length,
            playersDone: 0,
            occupancy: 1,
            deck: pack,
            turnIndex: 0,
            winners: '',
            messages: []
        });
        await newGame.save((err, savedGame) => {
            if (err) throw err;
            res.status(200).json({
                message: 'success',
            });
        });
    }
    await io.of('/lobby').emit('listRooms');
});

router.post('/joinRoom', async (req, res) => { 
    let room = await Game.find({roomid: req.body.roomid});
    let exist = await ActivePlayers.find({name: req.body.username});
    const io = req.app.get('socket-io');
    if(exist.length > 0){
        res.status(500).json({
            message: 'user already in a room',
        });
    }else{
        let pack = gameLogic.shufflePack(room[0].deck.slice());
        let pid = Date.now().toString()+Math.random().toString(36).substr(2, 9);
        let playerHand = gameLogic.draw(pack, 6, '', true);
        var data = {id: pid, name: req.body.username, hand: playerHand, cards: ['x', 'x', 'x', 'x', 'x', 'x'], roomKey: req.body.roomid, score: 0};
        const newPlayers = new ActivePlayers(data);
        newPlayers.save((err, data) => {
            if (err) throw err;   
        });
        let target = {roomid: req.body.roomid};
        let updater = {$inc: {occupancy: 1}, deck: pack, cardsLeft: pack.length};
        Game.updateOne(target, updater, (err, data) =>{
            if(err) throw err;   
            res.status(200).json({
                mesasge: 'join successfully'
            })
        });
    }
    await io.of('/lobby').emit('listRooms');
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

router.get('/getMessages', (req, res) => { 
    Game.find({roomid: req.query.id}, 'messages' ,(err, data) =>{
        if(err){
            console.log(err);
        }else{
            res.send(data);
        }
    });
});

router.get('/ranks', async (req, res) => { 
    let data = await Users.aggregate([{$sort: {wins: -1}}, {$project : { _id: 0, __v: 0 , email: 0, password: 0}}]);
    res.send(data);
});

module.exports = router;