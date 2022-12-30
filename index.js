const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;


//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.0zdruwc.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: " UnAuthorized Access" })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: " Forbidden Access" })
        }
        req.decoded = decoded;
        next()
    })
}

async function run() {

    try {
        const tasksCollection = client.db('KaTaskManagerDB').collection('tasks');

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10h' });
            res.send({ token })
        })


        // task api
        app.get('/tasks/user', async (req, res) => {
            let quarry = {}
            if (req.query.email) {
                quarry = {
                    userEmail: req.query.email, taskCompletedStatus: false
                }
            }
            const cursor = tasksCollection.find(quarry);
            const tasks = await cursor.toArray();
            res.send(tasks);
        })

        app.get('/tasks/completed', async (req, res) => {
            let quarry = {}
            if (req.query.email) {
                quarry = {
                    userEmail: req.query.email, taskCompletedStatus: true
                }
            }
            const cursor = tasksCollection.find(quarry);
            const tasks = await cursor.toArray();
            res.send(tasks);
        })
        app.post('/tasks', async (req, res) => {
            const task = req.body;
            const tasks = await tasksCollection.insertOne(task);
            res.send(tasks);
        })
        app.put('/task/completed/:id', async (req, res) => {
            const id = req.params.id;
            const taskCompletedStatus = req.body.taskCompletedStatus
            const quarry = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    taskCompletedStatus: taskCompletedStatus
                }
            }
            const task = await tasksCollection.updateOne(quarry, updateDoc, options);
            res.send(task);
        })
        // app.put('/task/comment/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const taskComment = req.body.taskComment
        //     const quarry = { _id: ObjectId(id) };
        //     const options = { upsert: true };
        //     const updateDoc = {
        //         $set: {
        //             taskComment: taskComment
        //         }
        //     }
        //     const task = await tasksCollection.updateOne(quarry, updateDoc, options);
        //     res.send(task);
        // })
        app.patch('/task/completed/:id', async (req, res) => {
            const id = req.params.id;
            const taskCompletedStatus = req.body.taskCompletedStatus
            const quarry = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    taskCompletedStatus: taskCompletedStatus
                }
            }
            const task = await tasksCollection.updateOne(quarry, updateDoc, options);
            res.send(task);
        })
        app.delete('/tasks/:id', async (req, res) => {
            const id = req.params.id;
            const quarry = { _id: ObjectId(id) };
            const tasks = await tasksCollection.deleteOne(quarry);
            res.send(tasks);
        })

    }
    finally {

    }
}

run().catch(error => console.error(error));


app.get('/', (req, res) => {
    res.send('ka-task-manager server is running')
});

app.listen(port, () => {
    console.log(`ka-task-manager server running on ${port}`);
});

