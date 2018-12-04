const express = require('express');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const passport = require('passport');
const unirest = require('unirest');

const app = express();

const config = require('./config');
const User = require('./models/user');

app.use(bodyParser.json());
app.use(cors());

mongoose.Promise = global.Promise;


// ---------------- RUN/CLOSE SERVER --------------------------------------------
let server = undefined;

function runServer(urlToUse) {
    return new Promise((resolve, reject) => {
        mongoose.connect(urlToUse, err => {
            if (err) {
                return reject(err);
            }
            server = app.listen(config.PORT, () => {
                console.log(`Listening on localhost:${config.PORT}`);
                resolve();
            }).on('error', err => {
                mongoose.disconnect();
                reject(err);
            });
        });
    });
}

if (require.main === module) {
    runServer(config.DATABASE_URL).catch(err => console.error(err));
}

function closeServer() {
    return mongoose.disconnect().then(() => new Promise((resolve, reject) => {
        console.log('Closing server');
        server.close(err => {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    }));
}

//-----------------------------
//------ENDPOINTS--------------

// POST
//-----creating a new user-----
app.post('/users/create', (req, res) => {

    //take the name, and the password from the ajax api call
    let name = req.body.name;
    let password = req.body.password;

    //exclude extra spaces from the name,email and password
    name = name.trim();
    password = password.trim();

    //create an encryption key
    bcrypt.genSalt(10, (err, salt) => {

        //if creating the key returns an error...
        if (err) {

            //display it
            return res.status(500).json({
                message: 'Internal server error'
            });
        }

        //using the encryption key above generate an encrypted pasword
        bcrypt.hash(password, salt, (err, hash) => {

            //if creating the ncrypted pasword returns an error..
            if (err) {

                //display it
                return res.status(500).json({
                    message: 'Internal server error'
                });
            }

            //using the mongoose DB schema, connect to the database and create the new user
            User.create({
                name,
                password: hash
            }, (err, item) => {

                //if creating a new user in the DB returns an error..
                if (err) {
                    //display it
                    return res.status(500).json({
                        message: 'Internal Server Error'
                    });
                }
                //if creating a new user in the DB is succefull
                if (item) {

                    //display the new user
                    console.log(`User \`${name}\` created.`);
                    return res.json(item);
                }
            });
        });
    });
});

//----signing in a user--------------
app.post('/users/login', function (req, res) {

    //take name and pass from the ajax api call
    const name = req.body.name;
    const password = req.body.password;
    //using mongoose DB schema, connect to database and user with the same name as above
    User.findOne({
        name: name
    }, function (err, items) {

        //if error connecting to the DB
        if (err) {
            return res.status(500).json({
                message: "error connecting to the DB"
            });
        }
        // if there are no users with that name
        if (!items) {
            return res.status(401).json({
                message: "no users with that name"
            });
        }
        //if the name is found
        else {
            items.validatePassword(password, function (err, isValid) {
                //if the connection to the DB to validate the password is not working
                if (err) {
                    return res.status(401).json({
                        message: "connection to the DB to validate the password is not working"
                    });
                }
                //if the password is not valid
                if (!isValid) {
                    return res.status(401).json({
                        message: "Password Invalid"
                    });
                }
                //if the password is valid
                else {
                    //return the logged in user
                    console.log(`User \`${name}\` logged in.`);
                    return res.json(items);
                }
            });
        };
    });
})

//----DELETE User-------------------
app.delete('/users/:id', function (req, res) {
    User
        .findByIdAndRemove(req.params.id).exec().then(function () {
        return res.status(204).end();
    }).catch(function (err) {
        return res.status(500).json({
            message: 'Internal Server Error'
        });
    });
});

//------------------
exports.app = app;
exports.runServer = runServer;
exports.closeServer = closeServer;
