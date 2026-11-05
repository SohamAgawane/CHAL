import mongoose, { Schema, type Document, type Model } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  city: string;
  avatar: string;
  avatarPublicId: string;
  refreshToken?: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    avatar: {
      type: String, // Cloudinary URL
      default: "",
    },
    avatarPublicId: {
      type: String, // Cloudinary public_id for deletion
      default: "",
    },
    refreshToken: {
      type: String,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password
userSchema.methods.isPasswordCorrect = async function (
  this: IUser,
  password: string
): Promise<boolean> {
  return await bcrypt.compare(password, this.password);
};

// Generate access token
userSchema.methods.generateAccessToken = function (this: IUser): string {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.name,
    },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || "15m" } as jwt.SignOptions
  );
};

// Generate refresh token
userSchema.methods.generateRefreshToken = function (this: IUser): string {
  return jwt.sign({ _id: this._id }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || "7d",
  } as jwt.SignOptions);
};

export const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);
