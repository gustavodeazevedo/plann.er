// filepath: c:\Users\gusta\vscodeProjetos\plann-er\backend\src\config\auth.ts
// Configura o JWT_SECRET de forma centralizada para garantir consistência
import { Secret, SignOptions } from "jsonwebtoken";

const isDevelopment = process.env.NODE_ENV !== "production";

// Em desenvolvimento, usamos uma chave fixa (não recomendado para produção)
// Em produção, exigimos que a chave seja definida em variáveis de ambiente
const JWT_SECRET_VALUE =
  process.env.JWT_SECRET ||
  (isDevelopment ? "development-jwt-secret-planner-app-2025" : undefined);

// Verifica e avisa sobre a configuração
if (!process.env.JWT_SECRET) {
  console.error("ATENÇÃO: JWT_SECRET não está definido no ambiente!");
  if (isDevelopment) {
    console.warn(
      "Usando valor padrão para JWT_SECRET em ambiente de desenvolvimento - NÃO FAÇA ISSO EM PRODUÇÃO!"
    );
  }
}

// Função para garantir que o JWT_SECRET seja uma string válida
// TypeScript não pode entender que a verificação abaixo garante que JWT_SECRET_VALUE não é undefined
// então precisamos fazer isso de forma explícita
if (!JWT_SECRET_VALUE && !isDevelopment) {
  throw new Error("JWT_SECRET é obrigatório em produção");
}

// Garantir que o valor seja tratado como string para evitar problemas de tipagem
const JWT_SECRET = JWT_SECRET_VALUE as string;

// Exporta a configuração para ser usada em todo o backend
export const authConfig = {
  JWT_SECRET,
  expiresIn: "7d" as const, // Token expira em 7 dias
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias em milissegundos
  },
};

// Para uso com jwt.sign, cria um objeto de opções do tipo SignOptions
export const jwtSignOptions: SignOptions = {
  expiresIn: authConfig.expiresIn,
};
