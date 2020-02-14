//Connect to Mongo database
const config = require('../config/config');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const uri = process.env.MONGODB_URI || `${config.host}/${config.directory}` 

mongoose.connect(uri).then(
    () => { 
        console.log('Connected to Mongo');       
    },
    err => {
         console.log('error connecting to Mongo: ')
         console.log(err);
        }
  );


module.exports = mongoose.connection;