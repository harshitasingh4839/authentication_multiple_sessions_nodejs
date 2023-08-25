const express = require('express');
const router = express.Router();
const createError = require('http-errors');
const UserModel = require('../Models/User.model');
// For Validation of Schema
const { authSchema } = require('../helpers/validation_schema');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../helpers/jwt_helpers')
const client = require('../helpers/init_redis');

// Register User
router.post('/register', async(req,res,next)=>{
    try {
        // To validate the schema
        const result = await authSchema.validateAsync(req.body)

        // To check if the entered email has already been taken
        const doesExist = await UserModel.findOne({ email: result.email })
        if (doesExist) throw createError.Conflict(`${result.email} is already been registered`);
        // If the validation is correct and email is unique then it is stored in the database 
        const user = new UserModel(result);
        // Saving the user info(email and password) to the local database.
        const savedUser = await user.save();
        // Creating the access-token and refresh token for the entered user.
        const accesstoken = await signAccessToken(savedUser.id);
        const refreshToken = await signRefreshToken(savedUser.id);
        
        res.send({accesstoken, refreshToken});

    }catch(error){
        // Change the error status from 500(internal server error) to 422(Unprocessable Entity)
        if (error.isJoi === true) error.status = 422
        next(error)
    }
})

// Login User
router.post('/login', async(req,res,next)=>{
    try {
        const result = await authSchema.validateAsync(req.body)
        const user = await UserModel.findOne({ email: result.email })
        if (!user) throw createError.NotFound('User not registered')
  
        const isMatch = await user.isValidPassword(result.password)
        if (!isMatch)
          throw createError.Unauthorized('Password not valid')
  
        const accessToken = await signAccessToken(user.id)
        const refreshToken = await signRefreshToken(user.id)

        // Sending the access token and refresh token as response 
        res.send({ accessToken, refreshToken })
      } catch (error) {
        if (error.isJoi === true)
          return next(createError.BadRequest('Invalid Username/Password'))
        next(error)
      }
})

// Use the refresh-token to generate a new pair of access-token and refresh-token
router.post('/refresh-token', async(req,res,next)=>{
  try {
    const { refreshToken } = req.body
    if (!refreshToken) throw createError.BadRequest()
    const userId = await verifyRefreshToken(refreshToken);
  
    // Give a new pair of access-token and refresh token
    const accessToken = await signAccessToken(userId)
    const refToken = await signRefreshToken(userId)
    res.send({ accessToken: accessToken, refreshToken: refToken })
  } catch (error) {
    
    next(error)
  }
})

// To delete the refresh token from redis server 
router.delete('/logout', async(req,res,next)=>{

  try {
    const { refreshToken } = req.body
    if (!refreshToken) throw createError.BadRequest()
    const userId = await verifyRefreshToken(refreshToken)
  //   client.DEL(userId, (err, val) => {
  //     if (err) {
  //       console.log(err.message)
  //       throw createError.InternalServerError()
  //     }
  //     console.log(val)
  //     res.sendStatus(204)
  //   })

  // To delete the refresh-token from redis server 
  return new Promise((resolve, reject) => {
    client.del(userId)
      .then(deletedCount => {
        if (deletedCount === 1) {
          // console.log(userId);
          res.sendStatus(204);
          resolve(); // Key deleted successfully
        } else {
          reject(createError.InternalServerError());
        }
      })
      .catch(error => {
        reject(error);
      });
  });
  } catch (error) {
    next(error)
  }
})

module.exports = router