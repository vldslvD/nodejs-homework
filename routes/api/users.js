import express from "express";
import usersController from "../../controllers/users.js";
import {isEmptyBody, authenticate, upload, resizeAvatar} from "../../middlewares/index.js";
import { validateBody } from "../../decorators/index.js";
import { userSignUpSchema, userEmailSchema} from "../../models/User.js";

const router = express.Router();
const userSignUpValidate = validateBody(userSignUpSchema);
const userEmailValidate = validateBody(userEmailSchema);
router.post('/register', isEmptyBody, userSignUpValidate, usersController.register)
router.get('/verify/:verificationCode', usersController.verify);
router.post('/verify',isEmptyBody, userEmailValidate, usersController.resendVerification);
router.post('/login', isEmptyBody, userSignUpValidate, usersController.login)
router.get('/current', authenticate, usersController.getCurrent);
router.post('/logout', authenticate, usersController.logout);
router.patch('/avatars',upload.single("avatar"),resizeAvatar, authenticate, usersController.updateAvatar);
export default router;