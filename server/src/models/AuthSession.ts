// FILE: server/src/models/AuthSession.ts
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const AuthSessionSchema = new Schema(
  {
    sessionToken: { type: String, required: true, trim: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    expires: { type: Date, required: true, index: true },
  },
  { timestamps: false, collection: "sessions" }
);

export type AuthSessionDoc = InferSchemaType<typeof AuthSessionSchema> & mongoose.Document;

export const AuthSession: Model<AuthSessionDoc> =
  (mongoose.models.AuthSession as Model<AuthSessionDoc>) ||
  mongoose.model<AuthSessionDoc>("AuthSession", AuthSessionSchema);
