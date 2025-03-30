import { Request, Response } from "express";
import { User } from "../models/User";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendMail } from "../services/mail";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret";

export class UserController {
  async register(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;

      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ error: "User already exists" });
      }

      const user = await User.create({
        name,
        email,
        password,
      });

      console.log("Generating token with JWT_SECRET:", JWT_SECRET);
      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

      return res.status(201).json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        token,
      });
    } catch (error) {
      console.error("Error in register:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

      return res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        token,
      });
    } catch (error) {
      console.error("Error in login:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const token = crypto.randomBytes(20).toString("hex");
      const expires = new Date();
      expires.setHours(expires.getHours() + 1); // Token expires in 1 hour

      user.passwordResetToken = token;
      user.passwordResetExpires = expires;
      await user.save();

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

      try {
        await sendMail({
          to: email,
          subject: "Recuperação de senha - plann.er",
          text: `Para redefinir sua senha, acesse o link: ${resetUrl}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #84cc16;">Recuperação de senha</h1>
              <p>Você solicitou a recuperação de senha da sua conta no plann.er.</p>
              <p>Clique no botão abaixo para criar uma nova senha:</p>
              <a href="${resetUrl}" style="display: inline-block; background-color: #84cc16; color: #1a2e05; text-decoration: none; padding: 12px 24px; border-radius: 8px; margin: 16px 0;">
                Criar nova senha
              </a>
              <p style="color: #71717a; font-size: 14px;">
                Se você não solicitou a recuperação de senha, ignore este e-mail.
              </p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Error sending password reset email:", emailError);
        // Even if email fails, we return success to prevent user enumeration
        // In a production environment, you might want to log this to a monitoring service
      }

      return res.json({
        message: "If the email exists, a recovery link has been sent",
      });
    } catch (error) {
      console.error("Error in forgotPassword:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, password } = req.body;

      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }

      user.password = password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      return res.json({ message: "Password successfully reset" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}
