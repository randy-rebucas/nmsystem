import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActivated: boolean;
  activationDate?: Date;
  lastPurchaseDate?: Date;
  sponsorId?: mongoose.Types.ObjectId;
  sponsor?: IUser;
  level: number; // Level in the genealogy tree
  wallet: {
    balance: number;
    pending: number;
    totalEarned: number;
  };
  rewardPoints: {
    balance: number;
    totalEarned: number;
    totalRedeemed: number;
  };
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    isActivated: {
      type: Boolean,
      default: false,
    },
    activationDate: {
      type: Date,
    },
    lastPurchaseDate: {
      type: Date,
    },
    sponsorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    level: {
      type: Number,
      default: 0,
    },
    wallet: {
      balance: {
        type: Number,
        default: 0,
      },
      pending: {
        type: Number,
        default: 0,
      },
      totalEarned: {
        type: Number,
        default: 0,
      },
    },
    rewardPoints: {
      balance: {
        type: Number,
        default: 0,
      },
      totalEarned: {
        type: Number,
        default: 0,
      },
      totalRedeemed: {
        type: Number,
        default: 0,
      },
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;

