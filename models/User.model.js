import mongoose from "mongoose";

// Defining Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  password: { type: String, required: true, trim: true },
  user_type: {
    type: String,
    enum: ['admin', 'user'],
},
 
})

// Model
const UserModel = mongoose.model("user", userSchema)

export default UserModel