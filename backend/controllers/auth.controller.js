import {asyncHandler} from "../middleware/asyncHandler.js";
import {ApiError} from "../utils/apiError.js";
import {User} from "../models/user.js";
import {generateToken} from "../utils/generateToken.js";

const toClientUser = (user) => {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
        avatar: user.avatar,
        createdAt: user.createdAt,
    };
};

export const register = asyncHandler(async (req, res) => {
    const {name, email, password, company} = req.body;
    
    if (!name || !email || !password) {
        throw new ApiError(400, "Name, email and password are required");
    }
    
    const exists = await User.findOne({email: email.toLowerCase()});
    if (exists) {
        throw new ApiError(400, "User already exists");
    }
    
    const user = await User.create({ name, email, password, company });
    
    res.status(201).json({success: true, token: generateToken(user._id), user: toClientUser(user)});
});

export const login = asyncHandler(async (req, res) => {
    const {email, password} = req.body;
    
    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }
    
    const user = await User.findOne({email: email.toLowerCase()});
    if (!user) {
        throw new ApiError(401, "Invalid email or password");
    }
    
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
        throw new ApiError(401, "Invalid email or password");
    }
    
    res.json({success: true, token: generateToken(user._id), user: toClientUser(user)});
});