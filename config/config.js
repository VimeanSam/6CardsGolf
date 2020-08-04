const url = {
    "dev": {
        host: "mongodb://localhost:27017",
        directory: 'heroku_qrn6zwvn'
    },
    "production": {
        host: "heroku-qrn6zwvn.dlk5t.mongodb.net/heroku_qrn6zwvn?authSource=admin&replicaSet=atlas-1vryq8-shard-0&readPreference=primary&appname=MongoDB%20Compass%20Community&ssl=true",
        credentials: "mongodb+srv://heroku_qrn6zwvn:48SNmrEGSJvVT3TH"
    }
   
};

module.exports = url;