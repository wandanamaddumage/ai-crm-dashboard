import mongoose from "mongoose";

export const TASK_STATUS = ["Pending", "In Progress", "Completed", "Cancelled"];
export const TASK_PRIORITY = ["Low", "Medium", "High"];

const taskSchema = new mongoose.Schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    title: {
        type: String,
        required: [true, "Title is required"],
        trim: true
    },
    description: {
        type: String,
        default: ""
    },
    dueDate: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: TASK_STATUS,
        default: "Pending",
        index: true
    },
    priority: {
        type: String,
        enum: TASK_PRIORITY,
        default: "Medium",
    },
    relatedLead: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lead",
        required: true
    },
    relatedContact: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Contact",
        required: true
    },
    completedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

export default mongoose.model("Task", taskSchema);