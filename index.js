const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const fileUpload = require('express-fileupload');
const fs = require('fs-extra');
const ObjectId = require('mongodb').ObjectId;

const { DB_USER, DB_PASS, DB_NAME, PORT } = process.env;

const uri = `mongodb+srv://${DB_USER}:${DB_PASS}@huntedcluster.hwtwh.mongodb.net/${DB_NAME}?retryWrites=true&w=majority`
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(fileUpload())

client.connect(err => {
    const houseCollection = client.db(`${DB_NAME}`).collection("rentHouses");
    const bookingsCollection = client.db(`${DB_NAME}`).collection("bookings");

    //root
    app.get('/', (req, res) => {
        res.send('Welcome to apartment hunt`s database........')
    })

    //add Rent Houses
    app.post('/add-rent-houses', (req, res) => {
        const thumbnail = req.files;
        const { name, data, mimetype, size } = thumbnail.thumbnail;
        const encThumbnail = data.toString('base64');

        const convertedThumbnail = {
            imgType: mimetype,
            size: parseFloat(size),
            img: Buffer.from(encThumbnail, 'base64')
        };

        houseCollection.insertOne({ ...req.body, convertedThumbnail })
            .then(result => {
                if (result.insertedCount) {
                    res.sendStatus(200)
                }
            })
            .catch(err => { console.log(err) })
    });


    //getting all the houses
    app.get('/rent-house-collection', (req, res) => {

        houseCollection.find({})
            .toArray((err, collection) => {
                res.send(collection);

                if (err) {
                    console.error(err);
                };
            });
    });

    //get single house
    app.get(`/house-details/:id`, (req, res) => {

        houseCollection.find({ _id: ObjectId(`${req.params.id}`) })
            .toArray((err, collection) => {
                res.send(collection);

                if (err) {
                    console.error(err);
                };

            });

    });

    //add bookings
    app.post('/add-bookings', (req, res) => {
        // const bookings = req.body;
        // console.log(bookings);

        bookingsCollection.insertOne({ ...req.body })
            .then(result => {
                console.log(result);
                if (result.insertedCount) {
                    res.sendStatus(200);
                };
            })
            .catch(err => console.error(err));
    });

    //all bookings
    app.get('/bookings', (req, res) => {

        bookingsCollection.find({})
            .toArray((err, collection) => {
                res.send(collection);

                if (err) {
                    console.error(err);
                }
            })
    });

    //single booking
    app.get('/booking/', (req, res) => {
        console.log(req.query.email);

        bookingsCollection.find({ email: req.query.email })
            .toArray((err, collection) => {

                res.send(collection);

                if (err) {
                    console.error(err)
                };
            });
    });

    //state update
    app.patch('/state-update/:id', (req, res) => {
        console.log(req.params.id, req.body)
        bookingsCollection.updateOne({ _id: ObjectId(req.params.id) }, {
            $set: { state: req.body.state }
        })
            .then(result => {
                if (result.modifiedCount > 0) {
                    res.sendStatus(200);
                    // res.send({ "state": `${req.body.state}` });
                }
            })
            .catch(err => console.log(err))
    });

    err ? console.log(err) : console.log('no error')
});

app.listen(PORT || 3100)