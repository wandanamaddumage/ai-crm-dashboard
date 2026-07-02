import jwt from "jsonwebtoken";

export const generateToken = (userId) => {
    jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || "7d"
    });
};