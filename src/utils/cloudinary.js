import fs from 'fs'
import {v2 as cloudinary} from 'cloudinary';
          
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localpath) => {
    try {
        if (!localpath) return null;
        
        // Upload the file to Cloudinary
        const response = await cloudinary.uploader.upload(localpath, { resource_type: "auto" });
        
        // Remove the file from the server
        fs.unlinkSync(localpath);
        return response;
    } catch (error) {
        fs.unlinkSync(localpath); // Remove the file from the server
        
        return null;
    }
}

const deleteFromCloudinary = async (avatarOldCloudinaryURL) => {
    try {

        const oldAvatarPublicId = avatarOldCloudinaryURL.split('/').pop().split('.')[0];

        if (!oldAvatarPublicId) return null;
        // Delete the file from Cloudinary
        const response = await cloudinary.uploader.destroy(oldAvatarPublicId);
        return response;
        
    } catch (error) {
        return null;
    }
}

export { uploadOnCloudinary, deleteFromCloudinary };
