import {v2 as cloudnary} from 'cloudinary'

cloudnary.config({
    api_key:process.env.CLOUDINARY_API_KEY!,
    api_secret:process.env.CLOUDINARY_SECRET_KEY!,
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME!
})


export default cloudnary

