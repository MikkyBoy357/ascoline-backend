const express = require("express")
const mongoose = require("mongoose")
const Client = require("./models/clientModel")
const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// routes

app.get('/', (req, res) => {
    res.send('Hello NODE API')
})

app.get('/blog', (req, res) => {
    res.send('Hello Blog')
})

app.get('/clients', async (req, res) => {
    try {
        const clients = await Client.find({});
        res.status(200).json(clients);

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message })
    }
})

app.get('/clients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const client = await Client.findById(id);
        res.status(200).json(client);

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message })
    }
})

app.post('/clients', async (req, res) => {
    try {
        const client = await Client.create(req.body)
        res.status(201).json(client);

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message })
    }
})

// update a client
app.put('/clients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const client = await Client.findByIdAndUpdate(id, req.body);
        // we cannot find any product in database
        if (!client) {
            return res.status(404).json({ message: `cannot find any product with ID ${id}` })
        }
        const updatedClient = await Client.findById(id);
        res.status(200).json(updatedClient);

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message })
    }
})

// delete a product
app.delete('/clients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const client = await Client.findByIdAndDelete(id);
        if (!client) {
            return res.status(404).json({ message: `cannot find any product with ID ${id}` })
        }
        res.status(200).json(client);

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message })
    }
})

const mongoUri = `mongodb+srv://mikkyboy:mikkyboy@tutorial.sbvct.mongodb.net/ascoline?retryWrites=true&w=majority`

mongoose.set("strictQuery", false)
mongoose.connect(mongoUri).then(() => {
    console.log("===========> connected to MongoDB <===========")
    app.listen(3000, () => {
        console.log(`Node API app is running on port 3000`)
    })
}).catch((error) => {
    console.log(error)
})