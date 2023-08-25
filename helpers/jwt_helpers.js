const JWT = require('jsonwebtoken')
const createError = require('http-errors')
const client = require('./init_redis')

module.exports = {
  signAccessToken: (userId) => {
    return new Promise((resolve, reject) => {
      const payload = {
    // name :"Harshita"
      }
    // const secret = "Some Secret"
      const secret = process.env.ACCESS_TOKEN_SECRET
      const options = {
        expiresIn: '2m',
      // issuer: 'pickurpage.com',
        audience: userId,
      }
      JWT.sign(payload, secret, options, (err, token) => {
        if (err) {
          console.log(err.message)
          // To hide the error in payload from the user since it is an internal server error and it does not concerns the 
          reject(createError.InternalServerError())
          return
        }
        resolve(token)
      })
    })
  },


// Function used to verify the access token given by the user with the actual access token
  verifyAccessToken: (req, res, next) => {
    if (!req.headers['authorization']) return next(createError.Unauthorized())
    const authHeader = req.headers['authorization']
    const bearerToken = authHeader.split(' ')
    const token = bearerToken[1]
    JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
    // If the JWT expires it will give 'Token Expired' error else it would give 'Unauthorized' error without sending the actual error message
      if (err) {
        const message =
          err.name === 'JsonWebTokenError' ? 'Unauthorized' : err.message
        return next(createError.Unauthorized(message))
      }
      req.payload = payload
      next()
    })
  },
  signRefreshToken: (userId) => {
    return new Promise((resolve, reject) => {
      const payload = {
      }
      const secret = process.env.REFRESH_TOKEN_SECRET
      const options = {
        expiresIn: '1y',
        audience: userId,
      }
      JWT.sign(payload, secret, options, (err, token) => {
        if (err) {
          console.log(err.message)
          // To hide the error in payload from the user since it is an internal server error and it does not concerns the client 
          reject(createError.InternalServerError())
          // return
        }
        // resolve(token)

        // Save the refresh-token in Redis Server
        // client.set(userId, token, 'EX', 365 * 24 * 60 * 60, (err, reply) => {
        //   if (err) {
        //     console.log(err.message)
        //     reject(createError.InternalServerError())
        //     return
        //   }
        //   resolve(token)
        // })
        client.set(userId,token,'EX',365 * 24 * 60 * 60)
              .then(reply=>{
                resolve(token);
              })
              .catch(err => {
                console.log(err.message);
                reject(createError.InternalServerError());
              });
      })
    })
  },
  verifyRefreshToken: (refreshToken) => {
    return new Promise((resolve, reject) => {
      JWT.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        (err, payload) => {
          if (err) return reject(createError.Unauthorized())
          const userId = payload.aud;
        // resolve(userId);
        // Get the refresh-token from redis server 
        // client.GET(userId, (err, result) => {
        //   if (err) {
        //     console.log(err.message)
        //     reject(createError.InternalServerError())
        //     return
        //   }
        //   if (refreshToken === result) return resolve(userId)
        //   reject(createError.Unauthorized())
        // })
        client.get(userId)
              .then(result => {
                  if (refreshToken === result) {
                      resolve(userId);
                     } else {
                        reject(createError.Unauthorized());
                     }
                  })
             .catch(err => {
              console.log(err.message);
              reject(createError.InternalServerError());
          });
        }
      )
    })
  },
};