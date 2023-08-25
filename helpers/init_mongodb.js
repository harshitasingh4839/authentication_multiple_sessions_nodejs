const mongoose = require('mongoose');
const UserModel = require('../Models/User.model');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err.message);
  });

//   mongoose.connection.on('connected', () => {
//     console.log('Mongoose connected to db')
//   })
  
//   mongoose.connection.on('error', (err) => {
//     console.log(err.message)
//   })
  
//   mongoose.connection.on('disconnected', () => {
//     console.log('Mongoose connection is disconnected.')
//   })
  
//   process.on('SIGINT', async () => {
//     await mongoose.connection.close()
//     process.exit(0)
//   })