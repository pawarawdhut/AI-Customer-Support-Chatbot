import mongoose, { Schema } from "mongoose";

const siteSchema = new Schema(
  {
    tenantId: { type: String, required: true, index: true },
    siteId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, maxlength: 60 },
    domain: { type: String, required: true, maxlength: 253 },
    assistantName: { type: String, required: true, maxlength: 40, default: "Orbit" },
    greeting: {
      type: String,
      required: true,
      maxlength: 240,
      default: "Hi there! How can I help you today?",
    },
    primaryColor: { type: String, required: true, default: "#6046e8" },
    knowledgeBase: { type: String, required: true, maxlength: 12000, default: "" },
  },
  { timestamps: true, versionKey: false },
);

siteSchema.index({ tenantId: 1, domain: 1 }, { unique: true });

const chatMessageSchema = new Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true, maxlength: 4000 },
  },
  { _id: false },
);

const conversationSchema = new Schema(
  {
    tenantId: { type: String, required: true, index: true },
    siteId: { type: String, required: true, index: true },
    conversationId: { type: String, required: true },
    messages: { type: [chatMessageSchema], default: [] },
  },
  { timestamps: true, versionKey: false },
);

conversationSchema.index({ siteId: 1, conversationId: 1 }, { unique: true });

const rateLimitSchema = new Schema(
  {
    _id: { type: String },
    count: { type: Number, required: true },
    windowStart: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false },
);

rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Site =
  mongoose.models.Site ?? mongoose.model("Site", siteSchema);
export const Conversation =
  mongoose.models.Conversation ??
  mongoose.model("Conversation", conversationSchema);
export const RateLimit =
  mongoose.models.RateLimit ?? mongoose.model("RateLimit", rateLimitSchema);
