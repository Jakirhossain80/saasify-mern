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

    /**
     * NextAuth MongoDB Adapter stores `image`
     * Your app previously used `imageUrl`
     * ✅ Support BOTH, keep them in sync.
     */
    image: { type: String, default: "", trim: true },
    imageUrl: { type: String, default: "", trim: true },

    /**
     * ✅ Platform RBAC (global) — canonical field for SaaSify
     */
    platformRole: {
      type: String,
      enum: ["user", "platformAdmin"],
      default: "user",
      index: true,
    },

    /**
     * ⚠️ Legacy alias (kept for backward compatibility if any older logic checks `role`)
     * Prefer `platformRole` everywhere.
     */
    role: {
      type: String,
      enum: ["user", "platformAdmin"],
      default: "user",
      index: true,
    },
  },
  { timestamps: true }
);

UserSchema.pre("validate", function () {
  const doc = this as unknown as {
    image?: string;
    imageUrl?: string;
    role?: "user" | "platformAdmin";
    platformRole?: "user" | "platformAdmin";
  };

  const img = (doc.image ?? "").trim();
  const imgUrl = (doc.imageUrl ?? "").trim();

  // If one exists but the other doesn't, copy it over
  if (!img && imgUrl) doc.image = imgUrl;
  if (!imgUrl && img) doc.imageUrl = img;

  // Normalize & sync platform role fields
  const pr = (doc.platformRole ?? "").trim() as "user" | "platformAdmin" | "";
  const r = (doc.role ?? "").trim() as "user" | "platformAdmin" | "";

  // Prefer platformRole as canonical
  if (!pr && r) doc.platformRole = r;
  if (pr && (!r || r !== pr)) doc.role = pr;
});

export type UserDoc = InferSchemaType<typeof UserSchema> & mongoose.Document;

export const User: Model<UserDoc> =
  (mongoose.models.User as Model<UserDoc>) || mongoose.model<UserDoc>("User", UserSchema);
