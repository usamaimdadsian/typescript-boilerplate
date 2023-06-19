import mongoose, { Document, Model } from "mongoose"

import { QueryResult } from "@/components";
import { AccessAndRefreshTokens } from "@/modules/token/TokenInterface";

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: string;
  isEmailVerified: boolean;
}

export interface IUserDoc extends IUser, Document {
  isPasswordMatch(password: string): Promise<boolean>;
}

export interface IUserModel extends Model<IUserDoc> {
  isEmailTaken(email: string, excludeUserId?: mongoose.Types.ObjectId): Promise<boolean>;
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
}

export type UpdateUserBody = Partial<IUser>;

export type NewRegisteredUser = Omit<IUser, 'role' | 'isEmailVerified'>;

export type NewCreatedUser = Omit<IUser, 'isEmailVerified'>;

export interface IUserWithTokens {
  user: IUserDoc;
  tokens: AccessAndRefreshTokens;
}