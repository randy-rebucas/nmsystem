import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICommission extends Document {
  fromUserId: mongoose.Types.ObjectId; // User who made the purchase
  toUserId: mongoose.Types.ObjectId; // User receiving the commission
  productId: mongoose.Types.ObjectId;
  transactionId: mongoose.Types.ObjectId;
  level: number; // Commission level (0-20)
  type: 'direct' | 'indirect'; // Direct (level 0) or Indirect (level 1-20)
  amount: number; // Commission amount
  status: 'pending' | 'paid' | 'failed';
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CommissionSchema = new Schema<ICommission>(
  {
    fromUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    toUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
      required: true,
    },
    level: {
      type: Number,
      required: true,
      min: 0,
      max: 20,
    },
    type: {
      type: String,
      enum: ['direct', 'indirect'],
      default: function(this: ICommission) {
        // Auto-set type based on level for backward compatibility
        return this.level === 0 ? 'direct' : 'indirect';
      },
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Commission: Model<ICommission> =
  mongoose.models.Commission ||
  mongoose.model<ICommission>('Commission', CommissionSchema);

export default Commission;

