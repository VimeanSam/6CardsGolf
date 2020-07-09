const express = require('express');
const router = express.Router();
const Player = require('../models/player');
const passport = require('../passportConfig');
const validator = require('../utils/validation');

router.post('/signup', (req, res) => {
    console.log('signup');
    const {username, email, password, unhashed} = req.body;
    Player.findOne({$or: [{username: username}, {email: email}]}, (err, user) => {
        if (err) {
            console.log(err);
        } else if (user) {
            console.log(user)
            res.json({
                error: `${username} or ${email} is already taken..`
            });
        }
        else {
            let checkEmail = validator.validateEmail(email);
            let checkPassword = validator.validatePassword(password);
            if(checkEmail && checkPassword === ''){
                const newPlayer = new Player({
                    username: username,
                    email: email,
                    password: password,
                    _unhashedBackup: unhashed,
                    wins: 0
                });
                newPlayer.save((err, savedPlayer) => {
                    if (err) return res.json(err)
                    //console.log(savedPlayer)
                    res.json(savedPlayer)
                });
            }else{
                if(!checkEmail && checkPassword === ''){
                    res.json({
                        error: 'email is invalid. Please try again.'
                    });
                }else if(checkEmail && checkPassword !== ''){
                    res.json({
                        error: checkPassword
                    });
                }else{
                    res.json({
                        error: 'email and password are invalid. Please try again.'
                    });
                }
            }
        }
    });
})

router.post('/login',
    function (req, res, next) {
        next();
    },
    passport.authenticate('local'),
    (req, res) => {
        console.log('logged in', req.user.username);
        var playerInfo = {
            username: req.user.username
        };
        res.send(playerInfo);
    }
)

module.exports = router;