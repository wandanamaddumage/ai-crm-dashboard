import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";

import connectDB from "./config/db.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";

dotenv.config();

const app = express();

/*---------------------------------------- Middleware ------------------------------------*/
app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true
    })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== "production") {
    app.use(morgan("dev"));
}

/*---------------------------------------- Routes -----------------------------------------*/
app.get("/api/health", (req, res) => {
    res.json({ success: true, status: "OK", service: "TTP AI CRM Dashboard API" });
});

app.use("/api/auth", authRoutes);

/*---------------------------------------- Error Handlers -----------------------------------------*/
app.use(notFound);
app.use(errorHandler);

/*---------------------------------------- Boot (Start Server) -----------------------------------------*/
const PORT = process.env.PORT || 8000;

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start server:", err.message);
        process.exit(1);
    }
};

startServer();

export default app;