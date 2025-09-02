import { put, del, head } from "@vercel/blob";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

// Carrega variáveis de ambiente
if (fs.existsSync(path.join(process.cwd(), ".env"))) {
  dotenv.config();
} else if (fs.existsSync(path.join(process.cwd(), "dist", ".env"))) {
  dotenv.config({ path: path.join(process.cwd(), "dist", ".env") });
}

// Verificar se o token está disponível
const isVercelBlobConfigured = !!process.env.BLOB_READ_WRITE_TOKEN;

if (isVercelBlobConfigured) {
  console.log("Vercel Blob Storage inicializado com sucesso!");
} else {
  console.warn(
    "Token do Vercel Blob ausente. O Vercel Blob Storage não estará disponível."
  );
}

/**
 * Função para fazer upload de um arquivo PDF para o Vercel Blob
 * @param filePath - Caminho do arquivo local
 * @param userId - ID do usuário para organização
 * @param tripId - ID da viagem para organização
 * @param fileName - Nome original do arquivo
 */
export async function uploadFile(
  filePath: string,
  userId: string,
  tripId: string,
  fileName: string
): Promise<{ url: string; pathname: string }> {
  if (!isVercelBlobConfigured) {
    throw new Error("Vercel Blob Storage não está configurado");
  }

  try {
    // Verifica se o arquivo existe
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo não encontrado: ${filePath}`);
    }

    // Lê o arquivo
    const fileBuffer = fs.readFileSync(filePath);

    // Define o pathname organizado
    const pathname = `planner/tickets/${userId}/${tripId}/${fileName}`;

    // Faz upload para o Vercel Blob
    const blob = await put(pathname, fileBuffer, {
      access: "public",
      contentType: "application/pdf",
    });

    return {
      url: blob.url,
      pathname: blob.pathname,
    };
  } catch (error) {
    console.error("Erro ao fazer upload para o Vercel Blob:", error);
    throw error;
  }
}

/**
 * Função para excluir um arquivo do Vercel Blob
 * @param url - URL do arquivo no Vercel Blob
 */
export async function deleteFile(url: string): Promise<void> {
  if (!isVercelBlobConfigured) {
    throw new Error("Vercel Blob Storage não está configurado");
  }

  try {
    await del(url);
  } catch (error) {
    console.error("Erro ao excluir arquivo do Vercel Blob:", error);
    throw error;
  }
}

/**
 * Função para verificar se um arquivo existe
 * @param url - URL do arquivo no Vercel Blob
 */
export async function fileExists(url: string): Promise<boolean> {
  if (!isVercelBlobConfigured) {
    throw new Error("Vercel Blob Storage não está configurado");
  }

  try {
    await head(url);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Função para obter URL de download (no Vercel Blob é a mesma URL)
 * @param url - URL do arquivo no Vercel Blob
 */
export function getDownloadUrl(url: string): string {
  return url; // No Vercel Blob, a URL é diretamente acessível
}
