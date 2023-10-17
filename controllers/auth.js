import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken";

import { HttpError } from "../helpers/HttpError.js";
import { controllerWrapper } from "../decorators/index.js";
import { User } from "../models/User.js";

const signup = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    throw HttpError(409, "Email in use")
  }

  const hashPassword = await bcrypt.hash(password, 10);
  const newUser = await User.create({ ...req.body, password: hashPassword });

  res.status(201).json({
    user: {
      email: newUser.email,
      subscription: newUser.subscription,
    }
  })
};

const signin = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(401, "Email or password is wrong")
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
    token
  })
};

const getCurrent = async (req, res) => {
  const { email, subscription } = req.user;
  res.json({
    email,
    subscription
  })
}
const signout = async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { token: "" });
  res.json({
    message: "Signout success"
  })
}
export default {
  signup: controllerWrapper(signup),
  signin: controllerWrapper(signin),
  getCurrent: controllerWrapper(getCurrent),
  signout: controllerWrapper(signout),
};
