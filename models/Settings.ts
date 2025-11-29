import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISettings extends Document {
  siteName: string;
  currency: string;
  minRedemptionPoints: number;
  minWithdraw: number;
  maxWithdraw: number;
  commissionStructure: {
    [key: number]: number; // Level -> Amount mapping
  };
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    siteName: {
      type: String,
      default: 'NMSystem',
    },
    currency: {
      type: String,
      default: 'PHP',
    },
    minRedemptionPoints: {
      type: Number,
      default: 100,
    },
    minWithdraw: {
      type: Number,
      default: 100,
    },
    maxWithdraw: {
      type: Number,
      default: 50000,
    },
    commissionStructure: {
      type: Map,
      of: Number,
      default: () => {
        const defaultStructure: { [key: number]: number } = {
          0: 165, // Direct (Level 0)
          1: 70,
          2: 70,
          3: 70,
          4: 70,
          5: 70,
          6: 60,
          7: 60,
          8: 60,
          9: 60,
          10: 60,
          11: 50,
          12: 50,
          13: 50,
          14: 50,
          15: 50,
          16: 40,
          17: 30,
          18: 20,
          19: 10,
          20: 5,
        };
        return defaultStructure;
      },
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one settings document exists
SettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const Settings: Model<ISettings> =
  mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);

export default Settings;

