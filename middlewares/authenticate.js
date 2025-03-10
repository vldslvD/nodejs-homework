import jwt from "jsonwebtoken";

import { HttpError } from "../helpers/index.js";
import { controllerWrapper } from "../decorators/index.js";
import { User } from "../models/User.js";

 const authenticate = async(req, res, next) => {
  const { authorization = ""} = req.headers;
  const [bearer, token] = authorization.split(" ");

   if (bearer !== "Bearer") {
    throw HttpError(401, "Not authorized");
   }
   try {
     const { id } = jwt.verify(token, process.env.JWT_SECRET)
     const user = await User.findById(id);
     if (!user || !user.token) {
       throw HttpError(401, "Not authorized");
       
     }
     req.user = user;
     next();
   } catch (error) {
     next(HttpError(401, "Not authorized"));
   }
}

export default controllerWrapper(authenticate);