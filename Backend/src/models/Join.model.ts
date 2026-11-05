import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import { JOIN_STATUS, type JoinStatus } from "../constants.js";

export interface IJoin extends Document {
  planId: Types.ObjectId;
  userId: Types.ObjectId;
  status: JoinStatus;
  createdAt: Date;
  updatedAt: Date;
}

const joinSchema = new Schema<IJoin>(
  {
    planId: {
      type: Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(JOIN_STATUS),
      default: JOIN_STATUS.PENDING,
    },
  },
  { timestamps: true }
);

// Unique index: one join request per user per plan
joinSchema.index({ planId: 1, userId: 1 }, { unique: true });

export const Join: Model<IJoin> = mongoose.model<IJoin>("Join", joinSchema);
