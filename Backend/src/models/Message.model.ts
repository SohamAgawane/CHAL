import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface IMessage extends Document {
  planId: Types.ObjectId;
  senderId: Types.ObjectId;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    planId: {
      type: Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: [true, "Message text is required"],
      trim: true,
      maxlength: [500, "Message cannot exceed 500 characters"],
    },
  },
  { timestamps: true }
);

messageSchema.index({ planId: 1, createdAt: -1 });

export const Message: Model<IMessage> = mongoose.model<IMessage>("Message", messageSchema);
