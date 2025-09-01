import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { authConfig } from "../config/auth";

interface TokenPayload {
  id: string;
  iat: number;
  exp: number;
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  const isDevelopment = process.env.NODE_ENV !== "production";

  // Log para depuração (apenas em desenvolvimento)
  if (isDevelopment) {
    console.log(`Requisição para: ${req.method} ${req.path}`);
    console.log(`Cabeçalho de autorização presente: ${!!authHeader}`);
    console.log(`Cookies presentes: ${!!req.cookies}`);
  }

  // Verificar token no cookie (método preferencial)
  if (req.cookies && req.cookies.auth_token) {
    token = req.cookies.auth_token;
    if (isDevelopment) console.log("Token encontrado em cookie");
  }
  // Verificar no query parameter (para downloads via window.open)
  else if (req.query.token && typeof req.query.token === "string") {
    token = req.query.token;
    if (isDevelopment) console.log("Token encontrado em query parameter");
  }
  // Verificar no cabeçalho de autorização (método legado)
  else if (authHeader) {
    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ error: "Token format invalid" });
    }

    token = parts[1];
    if (isDevelopment)
      console.log("Token encontrado no cabeçalho de autorização");

    // Se o cabeçalho X-Migrate-Token estiver presente, migrar para cookie
    if (req.headers["x-migrate-token"] === "true") {
      if (isDevelopment) console.log("Migrando token para cookie");
      res.cookie("auth_token", token, authConfig.cookieOptions);
    }
  }

  if (!token) {
    return res.status(401).json({ error: "Token not provided" });
  }

  if (!authConfig.JWT_SECRET) {
    return res
      .status(500)
      .json({ error: "Server authentication configuration error" });
  }

  try {
    const decoded = jwt.verify(token, authConfig.JWT_SECRET) as TokenPayload;
    req.userId = decoded.id;
    if (isDevelopment) console.log(`Token válido para usuário: ${decoded.id}`);
    return next();
  } catch (err) {
    // Evitar exposição de detalhes de erro
    console.error("Token verification error:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
