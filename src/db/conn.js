const mongoose = require("mongoose");
mongoose.set('strictQuery',false);
mongoose.connect("mongodb+srv://harshprasad669:DlrEvHBznVir0uSf@properties.jmfqh1l.mongodb.net/?retryWrites=true&w=majority&appName=properties",{
    useNewUrlParser:true,
    
}).then(() => {
    console.log("Connection successfull");
}).catch((e)=>{
    console.log("No connecton");
});