import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

// Carrega variáveis de ambiente
if (fs.existsSync(path.join(process.cwd(), ".env"))) {
  dotenv.config();
} else if (fs.existsSync(path.join(process.cwd(), "dist", ".env"))) {
  dotenv.config({ path: path.join(process.cwd(), "dist", ".env") });
}

// Verifica se as credenciais do Supabase estão disponíveis
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Inicializa o cliente Supabase
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

if (supabase) {
  console.log("Supabase Storage inicializado com sucesso!");
} else {
  console.warn(
    "Configurações do Supabase ausentes. O Supabase Storage não estará disponível."
  );
}

/**
 * Função para fazer upload de um arquivo para o Supabase Storage
 * @param filePath - Caminho do arquivo local
 * @param bucket - Nome do bucket no Storage (default: 'tickets')
 * @param storagePath - Caminho para armazenamento no bucket
 * @param contentType - Tipo de conteúdo do arquivo
 */
export async function uploadFile(
  filePath: string,
  bucket: string = "tickets",
  storagePath: string,
  contentType: string = "application/pdf"
): Promise<string | undefined> {
  if (!supabase) {
    throw new Error("Supabase Storage não está configurado");
  }

  try {
    // Verifica se o arquivo existe
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo não encontrado: ${filePath}`);
    }

    // Lê o arquivo como buffer
    const fileBuffer = fs.readFileSync(filePath);

    // Faz upload para o Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, fileBuffer, {
        contentType,
        upsert: true, // Sobrescreve arquivo se já existir
      });

    if (error) {
      throw error;
    }

    // Gera URL pública para o arquivo
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(storagePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error("Erro ao fazer upload para o Supabase Storage:", error);
    throw error;
  }
}

/**
 * Função para excluir um arquivo do Supabase Storage
 * @param storagePath - Caminho do arquivo no Storage
 * @param bucket - Nome do bucket no Storage (default: 'tickets')
 */
export async function deleteFile(
  storagePath: string,
  bucket: string = "tickets"
): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase Storage não está configurado");
  }

  try {
    const { error } = await supabase.storage.from(bucket).remove([storagePath]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Erro ao excluir arquivo do Supabase Storage:", error);
    throw error;
  }
}

/**
 * Função para gerar URL para download de um arquivo
 * @param storagePath - Caminho do arquivo no Storage
 * @param bucket - Nome do bucket no Storage (default: 'tickets')
 * @param expiresIn - Tempo de expiração em segundos (default: 60 minutos)
 */
export async function getSignedUrl(
  storagePath: string,
  bucket: string = "tickets",
  expiresIn: number = 60 * 60
): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase Storage não está configurado");
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, expiresIn);

    if (error) {
      throw error;
    }

    return data.signedUrl;
  } catch (error) {
    console.error("Erro ao gerar URL assinada:", error);
    throw error;
  }
}

export { supabase };
