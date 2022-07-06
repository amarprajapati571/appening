import UserModel from '../models/User.model.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import transporter from '../config/emailConfig.js'

class UserController {
  static userRegistration = async (req, res) => {
    const { name, email, password, password_confirmation,user_type } = req.body
    const user = await UserModel.findOne({ email: email })
    if (user) {
      res.send({ 
        status: false, 
         message: "Email already exists"
         })
    } else {
      if (name && email && password && password_confirmation&&user_type) {
        if (password === password_confirmation) {
          try {
            const salt = await bcrypt.genSalt(10)
            const hashPassword = await bcrypt.hash(password, salt)
            const doc = new UserModel({
              name: name,
              email: email,
              password: hashPassword,
              user_type:user_type
              
            })
            await doc.save()
            const saved_user = await UserModel.findOne({ email: email })
            // Generate JWT Token
            const token = jwt.sign({ userID: saved_user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '5d' })
            res.status(201).send({ "status": "success", "message": "Registration Success", "token": token })
          } catch (error) {
            console.log(error)
            res.send({
              status: false, 
                message: "Unable to Register"
               })
          }
        } else {
          res.send({ 
            status: false, 
            message: "Password and Confirm Password doesn't match"
           })
        }
      } else {
        res.send({ 
          status: false,  
          message: "All fields are required"
         })
      }
    }
  }

  static userLogin = async (req, res) => {
    try {
      const { email, password } = req.body
      if (email && password) {
        const user = await UserModel.findOne({ email: email })
        if (user != null) {
          const isMatch = await bcrypt.compare(password, user.password)
          if ((user.email === email) && isMatch) {
            // Generate JWT Token
            const token = jwt.sign({ userID: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '5d' })
            res.send({ 
              status: true, 
              message: "Login Success", 
              token: token 
            })
          } else {
            res.send({
               status: false, 
               message: "Email or Password is not Valid" 
              })
          }
        } else {
          res.send({
            status: false, 
              message: "You are not a Registered User" })
        }
      } else {
        res.send({ 
          status: false, 
           message: "All Fields are Required" 
          })
      }
    } catch (error) {
      console.log(error)
      res.send({ 
        status: false, 
         message: "Unable to Login" })
    }
  }

  static changeUserPassword = async (req, res) => {

    const { password, password_confirmation } = req.body
    if (password && password_confirmation) {
      if (password !== password_confirmation) {
        res.send({ 
          status: false, 
          message: "New Password and Confirm New Password doesn't match" })
      } else {
        const salt = await bcrypt.genSalt(10)
        const newHashPassword = await bcrypt.hash(password, salt)
        await UserModel.findByIdAndUpdate(req.user._id, { $set: { password: newHashPassword } })
        res.send({ 
          status: true, 
          message: "Password changed succesfully" })
      }
    } else {
      res.send({ 
        status: false, 
         message: "All Fields are Required"
       })
    }
  }

  static loggedUser = async (req, res) => {
    res.send({ user: req.user })
  }

  static sendUserPasswordResetEmail = async (req, res) => {
    const { email } = req.body
    if (email) {
      const user = await UserModel.findOne({ email: email })
      if (user) {
        const secret = user._id + process.env.JWT_SECRET_KEY
        const token = jwt.sign({ userID: user._id }, secret, { expiresIn: '15m' })
        const link = `http://127.0.0.1:3000/api/user/reset/${user._id}/${token}`
        console.log(link)
        // Send Email
        // let info = await transporter.sendMail({
        //   from: process.env.EMAIL_FROM,
        //   to: user.email,
        //   subject: "Appening - Password Reset Link",
        //   html: `<a href=${link}>Click Here</a> to Reset Your Password`
        // })
        res.send({ 
          status: true, 
          message: "Password Reset Email Sent... Please Check Your Email"
         })
      } else {
        res.send({ 
          status: false, 
          message: "Email doesn't exists"
         })
      }
    } else {
      res.send({
         status: false, 
         message: "Email Field is Required"
         })
    }
  }

  static userPasswordReset = async (req, res) => {
    const { password, password_confirmation } = req.body
    const { id, token } = req.params
    const user = await UserModel.findById(id)
    const new_secret = user._id + process.env.JWT_SECRET_KEY
    try {
      jwt.verify(token, new_secret)
      if (password && password_confirmation) {
        if (password !== password_confirmation) {
          res.send({ 
            status: false, 
            message: "New Password and Confirm New Password doesn't match"
           });
        } else {
          const salt = await bcrypt.genSalt(10)
          const newHashPassword = await bcrypt.hash(password, salt)
          await UserModel.findByIdAndUpdate(user._id, { $set: { password: newHashPassword } })
          res.send({ 
            status: true,
             message: "Password Reset Successfully" })
        }
      } else {
        res.send({ 
          status: false, 
          message: "All Fields are Required" 
        })
      }
    } catch (error) {
      console.log(error)
      res.send({ 
        status: false, 
        message: "Invalid Token" })
    }
  }
  static UsesListing=async(req,res)=>{
    try{
      let {user_type}=req.user;
      if(user_type==='admin'){
        let user=await UserModel.find({ user_type: { $ne: 'admin' } }).lean();
        res.send(user);
      }else{
        res.send({
          status:false,
          message:"You are not admin"
        })
      }
    }catch(err){
      console.log(err);
    }
  }
  static isAnagram=async(req,res)=>{
    try {
      let {str1,str2} =req.body;
      let isAnagram=(str1,str2)=>{
        if(str1.length!=str2.length){
          return res.send({
            status:false,
            message:`${str1} and ${str2} are not Anagram`
          })
          // return false;
        }
        let counter={};
        for(let letter of str1){
          counter[letter]=(counter[letter] || 0)+1;
        }
        for(let items of str2){
          if(!counter[items]){
            return res.send({
              status:false,
              message:`${str1} and ${str2} are not Anagram`
            })
            // return false;
          }
          counter[items]-=1;
        }
       return res.send({
          status:true,
          message:`${str1} and ${str2} are Anagram`
        });
        // return true;

        
        
      }
      isAnagram(str1,str2);
    } catch (err) {
      console.log(err);
    }
  }
}

export default UserController