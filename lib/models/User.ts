// ─── SellerGrid: User Model ───
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  image?: string;
  credits: number;
  role: 'owner' | 'staff';
  parentUserId?: string;
  referralCode?: string;
  referredBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: '' },
    image: { type: String },
    credits: { type: Number, default: 75 },
    role: { type: String, enum: ['owner', 'staff'], default: 'owner' },
    parentUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: String },
  },
  { timestamps: true },
);

const modelName = 'User';
const UserModel: Model<IUser> =
  mongoose.models[modelName] || mongoose.model<IUser>(modelName, UserSchema);

export default UserModel;
