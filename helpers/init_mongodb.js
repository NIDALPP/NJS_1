const mongoose=require('mongoose')

mongoose.connect(process.env.MONGODB_URL,{
    dbName:process.env.DB_NAME,
    user:process.env.DB_USER,
    pass:process.env.DB_PASSWORD

})
.then(() => console.log('Connected to MongoDB...'))
.catch((err)=>console.log(err.message))

mongoose.connection.on('connected',()=>{
    console.log('Connected to MongoDB...')

})

mongoose.connection.on('error',(err)=>{
    console.log(err.message)
})
mongoose.connection.on('disconnected',()=>{
    console.log('Disconnected from MongoDB...')
    })

process.on('SIGINT',async()=>{
    await mongoose.connection.close()
    process.exit(0)
})