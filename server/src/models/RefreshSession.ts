// FILE: server/src/models/RefreshSession.ts
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**

Stores hashed refresh tokens per session.

tokenHash: hashed raw refresh token (HMAC-SHA256)

revokedAt: when a session is invalidated (logout / reuse detection / admin action)

rotatedAt: updated on every successful refresh
*/
const RefreshSessionSchema = new Schema(
{
userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
tokenHash: { type: String, required: true, index: true },

expiresAt: { type: Date, required: true, index: true },

rotatedAt: { type: Date, default: null },
revokedAt: { type: Date, default: null },

userAgent: { type: String, default: null },
ip: { type: String, default: null },
},
{ timestamps: true, collection: "refresh_sessions" }
);

RefreshSessionSchema.index({ userId: 1, revokedAt: 1, expiresAt: 1 });

export type RefreshSessionDoc = InferSchemaType<typeof RefreshSessionSchema> & {
_id: mongoose.Types.ObjectId;
};

export const RefreshSession: Model<RefreshSessionDoc> =
(mongoose.models.RefreshSession as Model<RefreshSessionDoc>) ||
mongoose.model<RefreshSessionDoc>("RefreshSession", RefreshSessionSchema);