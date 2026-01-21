// FILE: server/src/models/VerificationToken.ts
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const VerificationTokenSchema = new Schema(
  {
    identifier: { type: String, required: true, trim: true },
    token: { type: String, required: true, trim: true },
    expires: { type: Date, required: true, index: true },
  },
  { timestamps: false, collection: "verification_tokens" }
);

// matches adapter uniqueness expectation
VerificationTokenSchema.index({ identifier: 1, token: 1 }, { unique: true });

export type VerificationTokenDoc = InferSchemaType<typeof VerificationTokenSchema> & mongoose.Document;

export const VerificationToken: Model<VerificationTokenDoc> =
  (mongoose.models.VerificationToken as Model<VerificationTokenDoc>) ||
  mongoose.model<VerificationTokenDoc>("VerificationToken", VerificationTokenSchema);
