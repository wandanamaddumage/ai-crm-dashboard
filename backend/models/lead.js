import mongoose from "mongoose";

export const LEAD_STATUS = ["New", "Qualified", "Proposal", "Won", "Lost"];
export const LEAD_PRIORITIES = ["Low", "Medium", "High"];

const leadSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Owner is required"],
        index: true
    },
    name: {
        type: String,
        required: [true, "Lead name is required"],
        trim: true
    },
    email: {
        type: String,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
        default: ""
    },
    phone: {
        type: String,
        trim: true,
        default: ""
    },
    company: {
        type: String,
        trim: true,
        default: ""
    },
    status: {
        type: String,
        enum: LEAD_STATUS,
        default: "New",
        index: true
    },
    priority: {
        type: String,
        enum: LEAD_PRIORITIES,
        default: "Medium",
    },
    source: {
        type: String,
        enum: ["Website", "Social", "Cold Outreach", "Referral","Event", "Other"],
        default: "Other"
    },
    value:{type: Number, default: 0, min: 0},
    notes: {type: String, default: ""},
    tags: [{type: String, trim: true}],
    aiSummary: {type: String, default: ""},
    aiRiskScore: {type: Number, default: null},
    order: {type: Number, default: 0}
}, {timestamps: true});

export default Lead = mongoose.model("Lead", leadSchema);