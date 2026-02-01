// FILE: server/src/models/User.ts
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
      unique: true,
    },
    name: { type: String, default: "", trim: true },

    // ✅ Needed for Phase-3 email/password login
    passwordHash: { type: String, default: null },

    // ✅ Used by auth.repo.ts -> setLastSignedInAt()
    lastSignedInAt: { type: Date, default: null },

    /**
     * Keep BOTH image fields for compatibility (NextAuth stores `image`)
     * Your app may use `imageUrl`
     */
    image: { type: String, default: "", trim: true },
    imageUrl: { type: String, default: "", trim: true },

    /**
     * ✅ Platform role is the ONLY platform-level role field.
     * Tenant roles live in Membership documents.
     */
    platformRole: {
      type: String,
      enum: ["user", "platformAdmin"],
      default: "user",
      index: true,
    },
  },
  { timestamps: true }
);

// Keep image and imageUrl in sync
UserSchema.pre("validate", function () {
  const doc = this as unknown as { image?: string; imageUrl?: string };

  const img = (doc.image ?? "").trim();
  const imgUrl = (doc.imageUrl ?? "").trim();

  if (!img && imgUrl) doc.image = imgUrl;
  if (!imgUrl && img) doc.imageUrl = img;
});

export type UserDoc = InferSchemaType<typeof UserSchema> & mongoose.Document;

export const User: Model<UserDoc> =
  (mongoose.models.User as Model<UserDoc>) || mongoose.model<UserDoc>("User", UserSchema);
