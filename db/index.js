//Connect to Mongo database
const config = require('../config/config');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

let uri = `${config["dev"].host}/${config["dev"].directory}` 

if(process.env.NODE_ENV === 'production'){
    uri = `${config["production"].credentials}@${config["production"].host}`  
}
 
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