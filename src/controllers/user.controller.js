import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudnary.js"
import { ApiResponse } from "../utils/ApiResponse.js"


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

//destructure
     const {fullname,email, username, password} = req.body
     console.log("email: ",email);

    //  if(fullname ==="") {
    //     throw new APIError(400, "Full Name is required")
    //  }

    if (
        [fullname, email, username, password].some( () => 
        field?.trim() === "")
    ){
        throw new APIError(400, "All fields are compulsory")
    }

    const existedUser  = User.findOne({
        $or: [{username},{email}]
    })

    if (existedUser){
        throw new APIError(409, "User with email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path; //localpath
    //reference the "const"
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new APIError(400, "Avatar is required");
        
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar){
        throw new APIError(400, "Avatar is required");
    }

    const user =  await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    //write what is not required with a negative sign


    if (!createdUser) {
        throw new APIError(500,"Something went wrong while registering a user");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Succesfully")
    )


})


export {registerUser}