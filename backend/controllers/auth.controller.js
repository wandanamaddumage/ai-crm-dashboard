import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import User from "../models/user.js";
import { generateToken } from "../utils/generate-token.js";

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
    
    const user = await User.findOne({email: email.toLowerCase()}).select("+password");
    if (!user || !(await user.matchPassword(password))) {
        throw new ApiError(401, "Invalid email or password");
    }
    
    res.json({success: true, token: generateToken(user._id), user: toClientUser(user)});
});

export const getMe = asyncHandler(async (req, res) => {
    res.json({success: true, user: toClientUser(req.user)});
});

export const updateProfile = asyncHandler(async (req, res) => {
    const {name, email, company, password} = req.body;
    console.log(name, email, company);
    const user = req.user;

    if (name !== undefined) user.name = name;
    if (company !== undefined) user.company = company;
    if (user.avatar !== undefined) user.avatar = user.avatar;
    if (password !== undefined) user.password = password;
    
    await user.save();
    
    res.json({success: true, user: toClientUser(user)});
});