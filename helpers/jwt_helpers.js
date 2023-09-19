const JWT = require('jsonwebtoken');
const createError = require('http-errors');
const client = require('./init_redis');
const { use } = require('../Routes/Auth.route');

module.exports = {
  signAccessToken: (userId) => {
    return new Promise((resolve, reject) => {
      const payload = {
        // Include user-specific data here if needed
        // name: "Harshita"
      };
      const secret = process.env.ACCESS_TOKEN_SECRET;
      const options = {
        expiresIn: '2m',
        audience: userId,
      };
      JWT.sign(payload, secret, options, (err, token) => {
        if (err) {
          console.log(err.message);
          reject(createError.InternalServerError());
        } else {
          resolve(token);
        }
      });
    });
  },

  verifyAccessToken: (req, res, next) => {
    if (!req.headers['authorization']) return next(createError.Unauthorized());
    const authHeader = req.headers['authorization'];
    const bearerToken = authHeader.split(' ');
    const token = bearerToken[1];
    JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
      if (err) {
        const message =
          err.name === 'JsonWebTokenError' ? 'Unauthorized' : err.message;
        return next(createError.Unauthorized(message));
      }
      req.payload = payload;
      next();
    });
  },

  signRefreshToken: (userId) => {
    return new Promise((resolve, reject) => {
      const payload = {};
      const secret = process.env.REFRESH_TOKEN_SECRET;
      const options = {
        expiresIn: '1y',
        audience: userId,
      };

      // Check the number of login devices
      client.scard(userId, (err, count) => {
        if (err) {
          console.log(err.message);
          reject(createError.InternalServerError());
          return;
        }

        // Restrict the number of devices
        if (count >= 3) {
          
          // reject(createError.TooManyRequests('Maximum number of devices reached'));

        // If the number of logged in device cross the max limit, then the first log in device will 
        // logout and the refersh-token will also pop out of the redis set data structure
          client.spop(userId,1);
        } 
        // else {
          JWT.sign(payload, secret, options, (err, token) => {
            if (err) {
              console.log(err.message);
              reject(createError.InternalServerError());
            } else {
              // Setting the key-value pair for multiple-device login with an expiry date of 1yr
              client.sadd(userId, token, (redisErr) => {
                if (redisErr) {
                  console.error(redisErr.message);
                  reject(createError.InternalServerError());
                } else {
                  // Set an expiration time for the key in Redis (1 year)
                  client.expire(userId, 31536000, (expireErr) => {
                    if (expireErr) {
                      console.error(expireErr.message);
                      reject(createError.InternalServerError());
                    } else {
                      resolve(token);
                    }
                  });
                }
              });
            }
          });
        // }
      });
    });
  },

  verifyRefreshToken: (refreshToken) => {
    return new Promise((resolve, reject) => {
      JWT.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        (err, payload) => {
          if (err) {
            return reject(createError.Unauthorized());
          }
          const userId = payload.aud;

          // Check if the given refresh token is a valid token
          client.sismember(userId, refreshToken, (err, result) => {
            if (err) {
              console.log(err.message);
              reject(createError.InternalServerError());
            } else if (result === 1) {
              resolve(userId);
            } else {
              reject(createError.Unauthorized());
            }
          });
        }
      );
    });
  },
};
