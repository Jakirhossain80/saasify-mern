// FILE: server/src/models/AuthAccount.ts
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const AuthAccountSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    type: { type: String, required: true, trim: true },
    provider: { type: String, required: true, trim: true, index: true },
    providerAccountId: { type: String, required: true, trim: true },

    refresh_token: { type: String, default: null },
    access_token: { type: String, default: null },
    expires_at: { type: Number, default: null },
    token_type: { type: String, default: null },
    scope: { type: String, default: null },
    id_token: { type: String, default: null },
    session_state: { type: String, default: null },

    oauth_token_secret: { type: String, default: null },
    oauth_token: { type: String, default: null },
  },
  { timestamps: false, collection: "accounts" }
);

// matches NextAuth adapter uniqueness expectation
AuthAccountSchema.index({ provider: 1, providerAccountId: 1 }, { unique: true });

export type AuthAccountDoc = InferSchemaType<typeof AuthAccountSchema> & mongoose.Document;

export const AuthAccount: Model<AuthAccountDoc> =
  (mongoose.models.AuthAccount as Model<AuthAccountDoc>) ||
  mongoose.model<AuthAccountDoc>("AuthAccount", AuthAccountSchema);
