import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler( async (req, res) =>{
    //to resgister
    //get user details from frontend
    //validation - not empty
    //check if user already exists: check username,email
    //check files avatar, images
    //upload them to cloudianry
    //create userObject - create entry in db
    // remove password and refresh token field from response
    //cheeck for user creation 
    //return response
})


export {registerUser}