import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
    {
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
        title: {
            type: String,
            trim: true,
            default: ""
        },
        tags: [{type: String, trim: true}],
        notes: {type: String, default: ""},
        favorite:{type: Boolean, default: false}
}, {timestamps: true});

contactSchema.index({name: "text", email: "text", company: "text"});

export default Contact = mongoose.model("Contact", contactSchema);