import fs from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken";
import gravatar from "gravatar";
import Jimp from "jimp";
import { nanoid } from "nanoid";

import { HttpError } from "../helpers/HttpError.js";
import { controllerWrapper } from "../decorators/index.js";
import { User } from "../models/User.js";
import { resizeAvatar } from "../middlewares/index.js";
import sendEmail from "../helpers/sendEmail.js";

const register = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    throw HttpError(409, "Email in use")
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const verificationCode = nanoid();
  const newUser = await User.create({ ...req.body, password: hashPassword, verificationCode, avatarURL: gravatar.url(email, { s: "200"}) });

  const verifyEmail = {
    to: email,
    subject: "Verify your email",
    html: `<a target=_blank href="${process.env.BASE_URL}/api/users/verify/${verificationCode}">Click</a>`,
  };
  await sendEmail(verifyEmail);
  res.status(201).json({
    user: {
      email: newUser.email,
      subscription: newUser.subscription,
    }
  })
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  
  if (!user) {
    throw HttpError(401, "Email or password is wrong")
  }

  if (!user.verify) {
    throw HttpError(401, "Email unverified" )
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password)

  if (!isPasswordCorrect) {
    throw HttpError(401, "Email or password is wrong")
  }
  const payload = {
    id: user._id,

  }
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "12h" });

  await User.findByIdAndUpdate(user._id, { token });
  res.json({
    token,
    user: {
      email,
      subscription: user.subscription
    }
  })
};

const updateAvatar = async (req, res) => {
  const avatarsPath = path.resolve("public", "avatars");
  const { path: oldPath, filename } = req.file;
  const newPath = path.join(avatarsPath, filename);
  fs.rename(oldPath, newPath);
  const pathToAvatar = path.join("avatars", filename);
  //resizeAvatar(path);
  await User.findByIdAndUpdate(req.user._id, {avatarURL: pathToAvatar});
  res.status(200).json({
    avatarURL: pathToAvatar,
  });
};

const getCurrent = async (req, res) => {
  const { email, subscription } = req.user;
  res.json({
    email,
    subscription
  })
}
const logout = async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { token: "" });
  res.status(204).json();
}

const verify = async (req, res) => {
  const { verificationCode } = req.params;
  const user = await User.findOne({ verificationCode });
  if (!user) {
    throw HttpError(404, "User not found");
  }

  await User.findByIdAndUpdate(user._id, { verify: true, verificationCode: "" });

  res.json({
    message: 'Verification successful',
  })
}

const resendVerification = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(404, "User not found");
  }

  if (user.verify) {
    throw HttpError(400, "Verification has already been passed");
  }

 const verifyEmail = {
    to: email,
    subject: "Verify your email",
    html: `<a target=_blank href="${process.env.BASE_URL}/api/users/verify/${user.verificationCode}">Click to verify email</a>`,
  };
  await sendEmail(verifyEmail);

  res.json({
    message: "Verification email sent"
  })
}
export default {
  register: controllerWrapper(register),
  verify: controllerWrapper(verify),
  resendVerification: controllerWrapper(resendVerification),
  login: controllerWrapper(login),
  getCurrent: controllerWrapper(getCurrent),
  logout: controllerWrapper(logout),
  updateAvatar: controllerWrapper(updateAvatar),
};
