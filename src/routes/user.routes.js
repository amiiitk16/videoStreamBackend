 import {Router} from "express";
 import { loginUser, logOutUser, registerUser } from "../controllers/user.controller.js";
 import {upload} from "../middlewares/multer.middleware.js"
 import { verify } from "crypto";
 import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router ()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser)

router.route("/login").post(loginUser);

//secured routes

router.route("/logout").post(verifyJWT, logOutUser)

router.get("/test", (req, res) => {
  res.send("Login route test OK");
});



export default router;

