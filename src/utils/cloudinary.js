import fs from 'fs'
import {v2 as cloudinary} from 'cloudinary';
          
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});


const uploadOnCloudinary = async (localpath) => {
    try{
        if(!localpath) return null;
        //upload the file on the cloudinary
        const response = await cloudinary.uploader.upload(localpath, { resource_type: "auto"});
        // console.log("File uploaded on the cloudinary: ", response.url); 
        fs.unlinkSync(localpath)
        return response;
    }
    catch(error){
        fs.unlinkSync(localpath);       //remove the file from the server
        return null   
    }
}


export { uploadOnCloudinary };

