import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRewardPoint extends Document {
  userId: mongoose.Types.ObjectId;
  points: number; // Positive for earned, negative for redeemed
  type: 'earned' | 'redeemed';
  source: 'purchase' | 'redemption' | 'bonus' | 'adjustment';
  description: string;
  relatedTransactionId?: mongoose.Types.ObjectId; // Link to purchase transaction
  relatedProductId?: mongoose.Types.ObjectId; // Product that earned points
  createdAt: Date;
  updatedAt: Date;
}

const RewardPointSchema = new Schema<IRewardPoint>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    points: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['earned', 'redeemed'],
      required: true,
    },
    source: {
      type: String,
      enum: ['purchase', 'redemption', 'bonus', 'adjustment'],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    relatedTransactionId: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
    },
    relatedProductId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
RewardPointSchema.index({ userId: 1, createdAt: -1 });

const RewardPoint: Model<IRewardPoint> =
  mongoose.models.RewardPoint ||
  mongoose.model<IRewardPoint>('RewardPoint', RewardPointSchema);

export default RewardPoint;

