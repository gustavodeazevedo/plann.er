import mongoose, { Document } from "mongoose";

interface Guest {
  name: string;
  accessId: string; // UUID para acesso único
  permissions: {
    canEdit: boolean;
    canInvite: boolean;
  };
}

export interface ITrip extends Document {
  destination: string;
  date: string;
  guests: Guest[];
  isDraft: boolean;
  user: mongoose.Types.ObjectId;
  collaborators: {
    userId: mongoose.Types.ObjectId;
    permissions: {
      canEdit: boolean;
      canInvite: boolean;
    };
  }[];
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
        name: {
          type: String,
          required: true,
        },
        accessId: {
          type: String,
          required: true,
          unique: true,
        },
        permissions: {
          canEdit: {
            type: Boolean,
            default: true,
          },
          canInvite: {
            type: Boolean,
            default: true,
          },
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
    collaborators: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        permissions: {
          canEdit: {
            type: Boolean,
            default: true,
          },
          canInvite: {
            type: Boolean,
            default: true,
          },
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Trip = mongoose.model<ITrip>("Trip", tripSchema);
