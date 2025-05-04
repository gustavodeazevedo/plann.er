import mongoose, { Document, Schema } from "mongoose";

export interface IChecklistItem extends Document {
  tripId: mongoose.Types.ObjectId;
  text: string;
  checked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChecklistItemSchema = new Schema(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    checked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const ChecklistItem = mongoose.model<IChecklistItem>(
  "ChecklistItem",
  ChecklistItemSchema
);
