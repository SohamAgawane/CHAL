import type { IUser } from "../models/User.model.ts";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

// This file must be a module
export {};
