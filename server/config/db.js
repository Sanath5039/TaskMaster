const mongoose = require('mongoose');
const dns = require('node:dns');

dns.setServers(['8.8.8.8', '1.1.1.1']);

const connectDB = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://sanath_user:sanath_user@cluster0.rmbqtfx.mongodb.net/taskmaster?retryWrites=true&w=majority";

        const conn = await mongoose.connect(MONGO_URI);

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;