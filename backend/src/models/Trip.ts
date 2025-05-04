import mongoose, { Document } from "mongoose";

interface Guest {
  name: string;
  email?: string;
  accessId: string;
  confirmed?: boolean;
  confirmedAt?: Date;
  userId?: mongoose.Types.ObjectId;
  permissions: {
    canEdit: boolean;
    canInvite: boolean;
  };
}

interface Task {
  _id?: mongoose.Types.ObjectId;
  description: string;
  completed: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface ITrip extends Document {
  destination: string;
  date: string;
  guests: Guest[];
  tasks: Task[];
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
        email: String,
        accessId: {
          type: String,
          required: true,
          unique: true,
        },
        confirmed: {
          type: Boolean,
          default: false,
        },
        confirmedAt: Date,
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
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
    tasks: [
      {
        description: {
          type: String,
          required: true,
        },
        completed: {
          type: Boolean,
          default: false,
        },
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
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
