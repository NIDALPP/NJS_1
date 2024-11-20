const redis = require('redis');

const client = redis.createClient({
    port:6379,
    host: "127.0.0.1"
});

(async () => {
    try {
        await client.connect(); 
        console.log('Redis client connected successfully');
    } catch (err) {
        console.error('Failed to connect to Redis:', err.message);
    }
})();
// client.on('connect',()=>{
//     console.log('Redis client connected successfully');
// })

client.on('ready', () => {
    console.log('Redis client is ready');
});

client.on('error', (err) => {
    console.error('Redis error:', err.message);
});

client.on('end', () => {
    console.log('Redis client disconnected');
});

process.on('SIGINT', async () => {
    if (client.isOpen) {
        await client.quit(); 
    }
    console.log('Redis client closed due to app termination');
    process.exit(0);
});

module.exports = client;
