// ─── SellerGrid: Credit Transaction Model ───
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICreditTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;           // positive = credit added, negative = credit used
  type: 'signup' | 'topup' | 'listing' | 'image' | 'refund' | 'referral';
  description: string;
  listingId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const CreditTransactionSchema = new Schema<ICreditTransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['signup', 'topup', 'listing', 'image', 'refund', 'referral'], required: true },
    description: { type: String, required: true },
    listingId: { type: Schema.Types.ObjectId, ref: 'Listing' },
  },
  { timestamps: true },
);

const modelName = 'CreditTransaction';
const CreditTransactionModel: Model<ICreditTransaction> =
  mongoose.models[modelName] || mongoose.model<ICreditTransaction>(modelName, CreditTransactionSchema);

export default CreditTransactionModel;
