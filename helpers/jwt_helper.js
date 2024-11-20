const JWT =require('jsonwebtoken')
const createError=require('http-errors')
const { token } = require('morgan')
const client=require('./init_redis')
const { result } = require('@hapi/joi/lib/base')

module.exports={
    signAccessToken:(userId)=>
        {
            return new Promise((resolve,reject)=>{
                const payload={userId}
                const secret=process.env.ACCESS_TOKEN_SECRET
                const options={
                    expiresIn:"20s",
                    audience:userId,
                    issuer:"apple.com"
                }
                JWT.sign(payload,secret,options,(err,token)=>{
                    if(err) {
                        console.log(err.message)

                    reject(createError.InternalServerError())
                    return;

                    }
                        resolve(token)
                })
            })
        },
        verifyAccessToken:(req,res,next)=>
        {
            if(!req.headers['authorization'])
                return next(createError.Unauthorized())
            const authHeader =req.headers['authorization']
            const bearerToken =authHeader.split(' ')
            const token =bearerToken[1]
            JWT.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,payload)=>{
                if(err){
                    // if(err.name==='jsonWebTokenError'){
                    //     return next(createError.Unauthorized())
                    // }else{
                    //     return next(createError.Unauthorized(err.message))

                    // }
                    const message=err.name==='jsonWebTokenError'?'Unauthorized':err.message
                    return next(createError.Unauthorized(message))
                }
                req.payload=payload
                next()
            })
        },
        signRefreshToken:(userId)=>
            {
                return new Promise((resolve,reject)=>{
                    const payload={userId}
                    const secret=process.env.REFRESH_TOKEN_SECRET
                    const options={
                        expiresIn:"1y",
                        audience:userId,
                        issuer:"apple.com"
                    }
                    JWT.sign(payload,secret,options,async(err,token)=>{
                        if(err) {
                            console.log(err.message)
    
                        reject(createError.InternalServerError())
    
                        }
                        const result = await client.SET(userId,token,'EX',365*24*60*60)
                        resolve(token)

                        // resolve(token)
                    })
                })
            },
            verifyRefreshToken: async (refreshToken) => {
                try {
                    const payload = JWT.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
                    const userId = payload.aud; 
                    const storedToken = await client.get(userId);
            
                    if (!storedToken) {
                        throw createError.Unauthorized("Token not found in Redis");
                    }
            
                    if (refreshToken !== storedToken) {
                        throw createError.Unauthorized("Invalid refresh token");
                    }
            
                    return userId; 
                } catch (err) {
                    if (err.name === "JsonWebTokenError") {
                        throw createError.Unauthorized("Invalid JWT token");
                    }
                    console.error("Error in verifyRefreshToken:", err.message);
                    throw createError.InternalServerError();
                }
            }
            
            
    }