import mongoose from "mongoose";

const noteSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Owner is required"],
        index: true
    },
    content: {
        type: String,
        required: [true, "Note content is required"],
        trim: true
    },
    lead: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lead",
        required: [true, "Lead is required"],
        index: true
    },
    contact: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Contact",
        index: true
    },
    pinned: {
        type: Boolean,
        default: false
    }
}, {timestamps: true});

export default mongoose.model("Note", noteSchema);
