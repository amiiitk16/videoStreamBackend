
import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudnary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken";



const generateAccessAndRefreshToken = async(userId) =>
    {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

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
    // req body -> data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send cookie

    const { email, username, password } = req.body
    console.log("Login attempt - email:", email, "username:", username);

    // 🔥 CHANGED: earlier only checked for username/email, 
    // now also ensure password is present
    if ((!username && !email) || !password) {
        throw new APIError(400, "Email/Username and password are required");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new APIError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new APIError(401, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    console.log("✅ Logged in successfully")

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



const logOutUser = asyncHandler(async(req,res) =>{
   await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

        const options = {
        httpOnly: true,
        secure: true
    }


    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out"))

})



const refreshAccessToken = asyncHandler(async(req, res) =>{
   const incomingRefreshToken =  req.cookie.refreshToken || req.body.refreshToken

    if (incomingRefreshToken) {
        throw new APIError(401,"Unauthorized req");
        
        
    }
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new APIError(401,"invalid req token");
            
            
        }
    
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new APIError(401,"Refresh token expired");
            
    
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
        
        const {accessToken, newrefreshToken} = await generateAccessAndRefreshToken(user._id);
    
        return res
        .status(200)
        .cookie("access token", accessToken, options)
        .cookie("refresh token", newrefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newrefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new APIError(401,error?.message || "invalid");
        
    }
})



export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken

}

