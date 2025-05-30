import { Request, Response } from "express";
import { User } from "../models/User";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendMail } from "../services/mail";
import { OAuth2Client } from "google-auth-library";
import { authConfig, jwtSignOptions } from "../config/auth";

const GOOGLE_CLIENT_ID =
  "804681981965-p0i2u26uc2j5qj5pk8che46cidk3i0ik.apps.googleusercontent.com";
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

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

      // Usamos o JWT_SECRET como uma string comum
      // e jwtSignOptions para as opções de assinatura
      const token = jwt.sign(
        { id: user._id },
        authConfig.JWT_SECRET,
        jwtSignOptions
      );

      // Configurar cookie para autenticação
      res.cookie("auth_token", token, authConfig.cookieOptions);

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

      // Usamos o JWT_SECRET como uma string comum
      // e jwtSignOptions para as opções de assinatura
      const token = jwt.sign(
        { id: user._id },
        authConfig.JWT_SECRET,
        jwtSignOptions
      );

      // Configurar cookie para autenticação
      res.cookie("auth_token", token, authConfig.cookieOptions);

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

  async googleLogin(req: Request, res: Response) {
    try {
      console.log("Google login request body:", req.body);
      const { credential } = req.body;

      if (!credential) {
        console.error("No credential provided");
        return res.status(400).json({ error: "No credential provided" });
      }

      console.log("Verifying token with Google...");
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      console.log("Google token payload:", payload);

      if (!payload || !payload.email) {
        console.error("Invalid payload or missing email");
        return res.status(400).json({ error: "Invalid Google token" });
      }

      let user = await User.findOne({ email: payload.email });
      console.log("Existing user found:", user ? "yes" : "no");

      if (!user) {
        console.log("Creating new user with Google data");
        user = await User.create({
          name: payload.name,
          email: payload.email,
          password: crypto.randomBytes(20).toString("hex"),
          googleId: payload.sub,
        });
      } else if (!user.googleId) {
        console.log("Updating existing user with Google ID");
        user.googleId = payload.sub;
        await user.save();
      }

      // Usamos o JWT_SECRET como uma string comum
      // e jwtSignOptions para as opções de assinatura
      const token = jwt.sign(
        { id: user._id },
        authConfig.JWT_SECRET,
        jwtSignOptions
      );

      // Configurar cookie para autenticação
      res.cookie("auth_token", token, authConfig.cookieOptions);

      console.log("JWT token generated successfully");

      return res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        token,
      });
    } catch (error) {
      console.error("Detailed error in Google login:", error);
      return res.status(500).json({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
