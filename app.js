const express = require('express');
const morgan = require('morgan');
const path = require('path');
const createError = require('http-errors');
require('dotenv').config();
require(path.join(__dirname,'./helpers/init_mongodb'));
const AuthRoute = require('./Routes/Auth.route')
const { verifyAccessToken } = require('./helpers/jwt_helpers');
require('./helpers/init_redis');

const PORT = process.env.PORT || 3000;
const app = express();

app.use(morgan('dev'));
// Parse JSON data
app.use(express.json());
// Parse URL-encoded data from form
app.use(express.urlencoded({ extended: true }));

// // Add a logging middleware
// app.use((req, res, next) => {
//     console.log('Received request:', req.method, req.url , req.body);
//     next();
//   });
  

// Root URL
app.get('/',verifyAccessToken, async(req,res,next)=>{
    console.log(req.headers['authorization'])
    res.send("Hello World");
})

// Authentication Routes
app.use('/auth', AuthRoute);

// To handle undefined routes
app.use(async(req,res,next)=>{
    next(createError.NotFound());
})

app.use((err,req,res,next)=>{
    res.status(err.status || 500);
    res.send({
        error:{
            status : err.status || 500,
            message : err.message
        }
    })
})


// Start the Server
const startServer = async () => {
    try {
        await new Promise((resolve, reject) => {
            app.listen(PORT, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
        console.log(`Server running on port ${PORT}`);
    } catch (error) {
        console.error('Error starting server:', error);
    }
};

startServer();


