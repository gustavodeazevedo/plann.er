import mongoose, { Document } from "mongoose";
import * as argon2 from "argon2";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  googleId?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    // Using argon2id variant which is the recommended choice for web applications
    this.password = await argon2.hash(this.password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MiB
      timeCost: 3, // 3 iterations
      parallelism: 4, // 4 threads
    });
    next();
  } catch (error) {
    return next(error as Error);
  }
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    const user = await User.findById(this._id).select("+password");
    if (!user) return false;
    return argon2.verify(user.password, candidatePassword);
  } catch (error) {
    return false;
  }
};

export const User = mongoose.model<IUser>("User", userSchema);
