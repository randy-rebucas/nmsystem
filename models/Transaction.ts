import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  product?: any;
  amount: number;
  type: 'purchase' | 'commission' | 'withdrawal' | 'maintenance';
  status: 'pending' | 'completed' | 'failed';
  commissionLevel?: number; // For commission transactions
  fromUserId?: mongoose.Types.ObjectId; // User who triggered the commission
  commissionAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['purchase', 'commission', 'withdrawal', 'maintenance'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    commissionLevel: {
      type: Number,
      min: 0,
      max: 20,
    },
    fromUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    commissionAmount: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;

