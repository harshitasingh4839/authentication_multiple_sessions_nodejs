const mongoose = require('mongoose');
const bcrypt = require('bcrypt')
const UserSchema = new mongoose.Schema({
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
  });
  
// This middleware is called before saving the user in the database. We can also use UserSchema.post to call a middle ware after saving the user in the database
  UserSchema.pre('save', async function (next) {
    try {
      /* 
      Here first checking if the document is new by using a helper of mongoose .isNew, therefore, this.isNew is true if document is new else false, and we only want to hash the password if its a new document, else  it will again hash the password if you save the document again by making some changes in other fields incase your document contains other fields.
      */
      if (this.isNew) {
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(this.password, salt)
        this.password = hashedPassword
      }
      next() 
      // console.log("called ");
    } catch (error) {
      next(error)
    }
  })

  // To check if the password entered by the user during login matches the password saved in the database 
  UserSchema.methods.isValidPassword = async function (password) {
    try {
      return await bcrypt.compare(password, this.password)
    } catch (error) {
      throw error
    }
  }

const UserModel = mongoose.model('UserModel',UserSchema);
module.exports = UserModel;

