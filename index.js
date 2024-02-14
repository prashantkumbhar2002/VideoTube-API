const express = require('express');
const app = express();

const PORT = 7000;

app.get('/',(req,res)=>{
    console.log('Hello World!!');
    res.send('Hello World!!');
})

app.listen(PORT,()=>{
    console.log("server is running the port ",PORT);
})