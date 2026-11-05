import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import { PLAN_CATEGORIES, type PlanCategory } from "../constants.js";

export interface ISubscription extends Document {
  subscriber: Types.ObjectId;
  city: string;
  category: PlanCategory;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    subscriber: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    category: {
      type: String,
      enum: PLAN_CATEGORIES,
      required: true,
    },
  },
  { timestamps: true }
);

// One subscription per user per city+category combo
subscriptionSchema.index({ subscriber: 1, city: 1, category: 1 }, { unique: true });

export const Subscription: Model<ISubscription> = mongoose.model<ISubscription>(
  "Subscription",
  subscriptionSchema
);
