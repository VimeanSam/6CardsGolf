const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');
const config = require('../config/config');
const url = process.env.MONGODB_URI || `${config.host}`;
const client = new MongoClient(url);

client.connect(function (err){ 
    db = client.db(config.directory);
    router.post("/theme", (req, res) => {
        db.collection('RoomLists').find({roomid: parseInt(req.body.roomID)}, {projection: {_id: 0}}).toArray((err, result) => {
            if (err) throw err;
            res.send(result);
        });
    });
});

module.exports = router;