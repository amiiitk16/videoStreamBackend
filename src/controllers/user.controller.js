
import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudnary.js"
import { ApiResponse } from "../utils/ApiResponse.js"



const generateAccessAndRefreshToken = async(userId) =>
    {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateRefreshToken()
        const refreshToken = user.generateAccessToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        
        return {accessToken, refreshToken}



    } catch (error) {
        throw new APIError(500,"Something went wrong while generating refresh and access token");
        
    }
}



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

 if ([fullname, email, username, password].some(field => !field || field.trim() === "")) {
    throw new APIError(400, "All fields are compulsory");
}

    const existedUser  = await User.findOne({
        $or: [{username},{email}]
    })

     if (existedUser) {
        throw new APIError(409, "User with email or username already exists")
    }
    //console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0) {
        coverImageLocalPath = req.files.coverImage[0].path
        
    } 


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



const loginUser = asyncHandler(async (req, res) => {
    //req body -> data
    // username or email
    //find the user
    //password check timestamp vid reftoken 7:40!!!
    //access and refresh token ->send to user
    //send cookies

    const {email, username, password} = req.body
    if (!username || !email) {
        throw new APIError(400, "Username or email is required :)");
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new APIError(404,"User not found :(");
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new APIError(401,"Password is Incorrect")
    }

    // make a method for access and refresh token
    // from t he method we get access and refresh token so destructure and get it!!
    const {accessToken, refreshToken} =  await generateAccessAndRefreshToken(user._id)


    const loggedInUser = await User.findById(User._id).select("-password -refreshToken")


    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in successfully"
        )
    )


})








export {
    registerUser,
    loginUser
}

