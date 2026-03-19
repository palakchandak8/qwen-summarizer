require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
app.use(cors()); // Keep it fully open for all as requested

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

app.get('/recent', async (req, res) => {
    try {
        const database = client.db('tldread');
        const collection = database.collection('summaries');
        
        const summaries = await collection.find({})
            .sort({ created_at: -1 })
            .limit(20)
            .toArray();
            
        res.json({ summaries });
    } catch (err) {
        console.error("Error fetching summaries:", err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = 3000;

client.connect().then(() => {
    console.log("Connected to MongoDB Atlas!");
    app.listen(PORT, () => {
        console.log(`Dedicated Website API running on http://localhost:${PORT}`);
    });
}).catch(console.error);
