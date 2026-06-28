import { ApiError } from "../utils/api-error.js";

export const notFound = (req, res, next) => {
    const error = new Error(`Route Not found: ${req.method} ${req.originalUrl}`);
    res.status(404);
    next(error);
};

export const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    
    // MongoDB cast error (e.g., invalid ObjectId)
    if (err.name === "CastError") {
        statusCode = 400;
        message = `Invalid input data ${err.path}: | ${err.value}`;
    }

    // MongoDB duplicate key error
    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyValue || {})[0] || "field";
        message = `Duplicate field value entered for ${field}`;
    }

    // Mongoose schema validation error
    if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors).map(val => val.message).join(", ");
    }

    if (process.env.NODE_ENV === "production" && statusCode >= 500) {
        console.error("❌ Internal Server Error:", err);
    }
    
    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === "production" && statusCode >= 500 
            ? { stack: err.stack }
            : {})
    });
};