import mongoose, { Document } from "mongoose";

interface Guest {
  email: string;
  confirmed: boolean;
  confirmedAt?: Date;
}

export interface ITrip extends Document {
  destination: string;
  date: string;
  guests: Guest[];
  isDraft: boolean;
  user: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const tripSchema = new mongoose.Schema(
  {
    destination: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    guests: [
      {
        email: {
          type: String,
          required: true,
        },
        confirmed: {
          type: Boolean,
          default: false,
        },
        confirmedAt: {
          type: Date,
        },
      },
    ],
    isDraft: {
      type: Boolean,
      default: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Trip = mongoose.model<ITrip>("Trip", tripSchema);
