const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Allow requests from http://localhost:3001 (your frontend origin)
app.use(cors({
    origin: 'http://localhost:3001'
  }));  

// Routes
const clientsRoutes = require('./routes/clients');
const commandesRoutes = require('./routes/commandes');

app.use('/clients', clientsRoutes);
app.use('/commandes', commandesRoutes);

app.get('/', (req, res) => {
    res.send('Hello NODE API');
});

app.get('/blog', (req, res) => {
    res.send('Hello Blog');
});

const mongoUri = `mongodb+srv://mikkyboy:mikkyboy@tutorial.sbvct.mongodb.net/ascoline?retryWrites=true&w=majority`;

mongoose.set("strictQuery", false);
mongoose.connect(mongoUri).then(() => {
    console.log("===========> connected to MongoDB <===========");
    app.listen(3000, () => {
        console.log(`Node API app is running on port 3000`);
    });
}).catch((error) => {
    console.log(error);
});
