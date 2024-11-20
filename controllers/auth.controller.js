const client = require("../helpers/init_redis")
const createError=require('http-errors')
const User = require('../models/user.model')
const { authSchema } = require('../helpers/validation')
const {signAccessToken,signRefreshToken,verifyRefreshToken}=require('../helpers/jwt_helper')

module.exports={
    register:async(req,res,next)=>{
        console.log(req.body)
        try{
            // const{email,password}=req.body
            // if(!email || !password)throw createError.BadRequest()
            const result=await authSchema.validateAsync(req.body)
            
    
            const doesExist=await User.findOne({email:result.email})
            if(doesExist) throw createError.Conflict(`${result.email} is already registered`)
    
            const user = new User(result)
            const savedUser=await user.save()
            const accessToken=await signAccessToken(savedUser.id)
            const refreshToken=await signRefreshToken(savedUser.id)
            res.send({accessToken,refreshToken})
    
            res.send(savedUser)
    
    
    
        }catch(error){
            if(error.isJoi===true) error.status=422
            next(error)
        }
    },
    login:async(req,res,next)=>{
        try{
            const result=await authSchema.validateAsync(req.body)
            const user =await User.findOne({email:result.email})
            if(!user) throw createError.NotFound('user not registered')
    
            const isMatch= await user.isValidPassword(result.password)
            if(!isMatch)throw createError.Unauthorized('Username/Password not valid')
            
            const accessToken=await signAccessToken(user.id)
            const refreshToken=await signRefreshToken(user.id)
    
    
            res.send({accessToken,refreshToken})
        }catch(error){
            if(error.isJoi===true)return next (createError.BadRequest("Invalid username/password"))
            next(error)
        }
    },
    refreshToken:async(req,res,next)=>{
        try{
            const {refreshToken}=req.body
            if(!refreshToken) throw createError.BadRequest()
            const userId=await verifyRefreshToken(refreshToken)
    
            const accessToken=await signAccessToken(userId)
            const refToken=await signRefreshToken(userId)
            res.send({accessToken:accessToken,refreshToken:refToken})
        }catch(error){
            next(error)
        }
    },
    logout: async (req, res, next) => {
        try {
            const { refreshToken } = req.body;
    
            if (!refreshToken) {
                throw createError.BadRequest("Refresh token is required");
            }
    
            const userId = await verifyRefreshToken(refreshToken);

            const result = await client.del(userId);
    
            if (result === 0) {
                console.log(`No token found for user ID: ${userId}`);
            }
    
            res.sendStatus(204); 
        } catch (error) {
            console.error("Error in logout:", error.message);
            next(error);
        }
    },
    
}