const mongoose = require('mongoose');
const MONGO_URI = 'mongodb://localhost:27017/interview';

const connectDatabase = () => {
    mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => {
            console.log("Mongoose Connected");
        })
        .catch((err) => {
            console.log("Mongoose Connection Error: ", err);
        });
}

module.exports = connectDatabase;