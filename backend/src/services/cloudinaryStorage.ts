import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

// Carrega variáveis de ambiente
if (fs.existsSync(path.join(process.cwd(), ".env"))) {
  dotenv.config();
} else if (fs.existsSync(path.join(process.cwd(), "dist", ".env"))) {
  dotenv.config({ path: path.join(process.cwd(), "dist", ".env") });
}

// Configuração do Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Verificar se as credenciais estão disponíveis
const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  console.log("Cloudinary Storage inicializado com sucesso!");
} else {
  console.warn(
    "Configurações do Cloudinary ausentes. O Cloudinary Storage não estará disponível."
  );
}

/**
 * Função para fazer upload de um arquivo PDF para o Cloudinary
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
): Promise<{ url: string; publicId: string }> {
  if (!isCloudinaryConfigured) {
    throw new Error("Cloudinary Storage não está configurado");
  }

  try {
    // Verifica se o arquivo existe
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo não encontrado: ${filePath}`);
    }

    // Remove a extensão do nome do arquivo para o public_id
    const fileNameWithoutExt = path.parse(fileName).name;

    // Faz upload para o Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "raw", // Importante para PDFs
      folder: `planner/tickets/${userId}/${tripId}`,
      public_id: fileNameWithoutExt,
      use_filename: true,
      unique_filename: true,
      access_mode: "public", // Para facilitar o acesso direto
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error("Erro ao fazer upload para o Cloudinary:", error);
    throw error;
  }
}

/**
 * Função para excluir um arquivo do Cloudinary
 * @param publicId - ID público do arquivo no Cloudinary
 */
export async function deleteFile(publicId: string): Promise<void> {
  if (!isCloudinaryConfigured) {
    throw new Error("Cloudinary Storage não está configurado");
  }

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: "raw", // Importante especificar para PDFs
    });
  } catch (error) {
    console.error("Erro ao excluir arquivo do Cloudinary:", error);
    throw error;
  }
}

/**
 * Função para gerar URL segura (opcional, já que usamos URLs públicas)
 * @param publicId - ID público do arquivo no Cloudinary
 * @param expiresIn - Tempo de expiração em segundos (não usado com URLs públicas)
 */
export async function getSignedUrl(
  publicId: string,
  expiresIn: number = 60 * 60
): Promise<string> {
  if (!isCloudinaryConfigured) {
    throw new Error("Cloudinary Storage não está configurado");
  }

  try {
    // Para arquivos públicos, retornamos a URL direta
    // Se precisar de URLs com expiração, seria necessário implementar lógica adicional
    const url = cloudinary.url(publicId, {
      resource_type: "raw",
      secure: true,
    });

    return url;
  } catch (error) {
    console.error("Erro ao gerar URL do Cloudinary:", error);
    throw error;
  }
}

export { cloudinary };
