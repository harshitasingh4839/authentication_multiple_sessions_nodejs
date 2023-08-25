# authentication_singledevice_login_nodejs

This is a back-end implementation of Authentication system using the concept of access-token and refresh-token in NodeJs, ExpressJs, MongoDb and Redis for a single device login. 

In this project I have used several npm packages like:
1. express - to create the server.
2. mongoose - to connect my nodejs app to the mongoDb server.
3. jsonwebtoken - to create access token and refresh token.
4. ioredis - to connect to the  redis server where i will be saving my refresh token.
5. @hapi/joi - this package  is used for validating the schema(email and password).
6. bcrypt - to hash the password while saving it in mongoDb. This package uses Blowfish algorithm for password hashing.
7. dotenv - to store the environment variables.
8. http-errors - to handle errors
9. nodemon
10. morgan - to log the request inside the console.

List of Routes created :
1. '/' - Main route which has been authenticated(using the concept of middleware).
2. '/auth/register' - to register the user. Connected to mongodb server to save the registered user.
3. '/auth/login' - to login the user. Uses mongodb to check if the user is a registered user.
4. '/auth/refersh-token' - to create a new pair of access token and refersh token. Uses redis server to check if the given refersh token is a valid token.
5. '/auth/logout' - delete the refresh-token from redis server and logout the user.

Workflow 

1. Connect to mongodb database(using mongoose)
2. Connect to redis server(using ioredis)
3. Generate a secret key(using crypto).
4. Create a model schema for the user information(using mongoose).
5. Validate the schema(using @hapi/joi).

'/auth/register' route:
1. Check if the user has already been regsitered, then throw an error of ${email} already been registered(using http-errors).
1. Otherwise if not a registered user then save the registration details of the user in mongodb(using mongoose).
2. Hash the password before saving it to the mongodb database(using bcrypt).
3. Generate a pair of access-token and refresh-token for the user using the secret key(using jwtwentoken).
4. Save the refresh-token in redis server(using set method from ioredis).

'auth/login' route:
1. Check if the user is a registered user from our mongodb database(using findone function).
2. If the entered email or password doesn't match, throw an error(using http-errors).
3. Generate a pair of access-token and refresh-token for the user using the secret key(using jwtwentoken).
4. Save the refresh-token in redis server(using set method from ioredis).

'/auth/refresh-token' route:
1. Check if the given refresh-token is a valid token and is present in redis server(using get methof of ioredis)
2. If the refresh-token is valid return a new pair of access-token and refresh-token and remove the previous refersh-tone from redis and in place of that save the new refersh-token.(using ioredis).
3. If the refresh-token is not valid, throw an error of 'Unauthorized'(using http-errors).

'/auth/logout' route:
1. Check the validity of refresh-token, if it does not match throw 'Unauthorized' error.
2. If the refersh-token matches from the token saved in redis, then delete the token from redis server and send res.sendstatus 204(using del method of ioredis).


'/' route:
1. Create a middleware which will authenticate this route.
2. If the access-token provided by the user matches then display the content.
3. If the access-token provided by the user doesn't match throw 'Unauthorized' error(using http-errors).
4. If the access-token gets expired, send 'JWT expired error'9using http-errors).



   

