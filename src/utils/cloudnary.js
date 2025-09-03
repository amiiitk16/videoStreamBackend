// import {v2 as cloudinary} from "cloudinary"
// import fs from "fs"

// cloudinary.config({ 
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
//   api_key: process.env.CLOUDINARY_API_KEY, 
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });


// const uploadOnCloudinary = async (localFilePath) => {
//     try {
//         if(!localFilePath) return null
//         //upload the file on cloudinary
//        const response = await cloudinary.uploader.upload(localFilePath, {
//             //options
//             resource_type: "auto"
//         })
//         //file has been uploaded 
//         console.log("file is uploaded on cloudinary",response.url);
//         return response;

//     } catch (error) {
//         fs.unlinkSync(localFilePath) //remove the locally saved temporary file as the upload opp is failed
//         return null;
//     }
// }



// export {uploadOnCloudinary}


import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // file has been uploaded
    console.log("file is uploaded on cloudinary", response.url);

    // remove the local file after successful upload
    try {
      fs.unlinkSync(localFilePath);
    } catch (err) {
      console.warn("Failed to delete local file:", err.message);
    }

    return response;
  } catch (error) {
    // remove the locally saved temporary file if upload failed
    try {
      fs.unlinkSync(localFilePath);
    } catch (err) {
      console.warn("Failed to delete local file on error:", err.message);
    }
    return null;
  }
};

export { uploadOnCloudinary };

