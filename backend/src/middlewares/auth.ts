import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface TokenPayload {
  id: string;
  iat: number;
  exp: number;
}

const JWT_SECRET = process.env.JWT_SECRET || "default-secret";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ error: "Token not provided" });
  }

  const [, token] = authorization.split(" ");

  try {
    console.log("Using JWT_SECRET:", JWT_SECRET);
    console.log("Token received:", token);

    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    console.log("Token decoded successfully:", decoded);

    req.userId = decoded.id;
    return next();
  } catch (err) {
    console.error("Token verification error:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
}
