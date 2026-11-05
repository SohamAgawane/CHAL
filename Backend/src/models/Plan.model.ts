import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import { PLAN_CATEGORIES, type PlanCategory } from "../constants.js";

export interface IPlan extends Document {
  title: string;
  category: PlanCategory;
  location: string;
  address: string;
  city: string;
  date: Date;
  time: string;
  totalSpots: number;
  joinedCount: number;
  hostedBy: Types.ObjectId;
  isOpen: boolean;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const planSchema = new Schema<IPlan>(
  {
    title: {
      type: String,
      required: [true, "Plan title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    category: {
      type: String,
      enum: PLAN_CATEGORIES,
      required: [true, "Category is required"],
    },
    location: {
      type: String,
      required: [true, "Location name is required"],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      lowercase: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    time: {
      type: String,
      required: [true, "Time is required"],
    },
    totalSpots: {
      type: Number,
      required: [true, "Total spots is required"],
      min: [2, "Plan must have at least 2 spots"],
      max: [100, "Plan cannot exceed 100 spots"],
    },
    joinedCount: {
      type: Number,
      default: 1, // Host counts as 1
      min: 0,
    },
    hostedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isOpen: {
      type: Boolean,
      default: true, // true = anyone can join, false = host approves
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
  },
  { timestamps: true }
);

// Compound index for fast city + category filtering
planSchema.index({ city: 1, category: 1 });
planSchema.index({ date: 1 });
planSchema.index({ hostedBy: 1 });

export const Plan: Model<IPlan> = mongoose.model<IPlan>("Plan", planSchema);
