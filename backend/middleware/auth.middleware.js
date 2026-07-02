import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";

export const protect = asyncHandler(async (req, res, next) => {
    let token;
    const header = req.headers.authorization;
    
    if (header && header.startsWith("Bearer")) {
       token = header.split(" ")[1];
    }
    
    if (!token) {
        throw new ApiError(401, "Not authorized, no token provided");
    }

    let decoded;
    
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new ApiError(401, "Not authorized, token invalid or expired");
    }

    const user = await User.findById(decoded.id);
    
    if (!user) {
        throw new ApiError(401, "Not authorized, user not found");
    }
    
    req.user = user;
    
    next();
});
