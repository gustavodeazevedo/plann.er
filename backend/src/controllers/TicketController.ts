import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { Trip } from "../models/Trip";
import multer from "multer";
import {
  uploadFile,
  deleteFile,
  getDownloadUrl,
} from "../services/vercelBlobStorage";

// Configuração do Multer para armazenamento temporário de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Certifique-se de que o diretório de uploads temporários existe
    const uploadDir = path.join(__dirname, "../../temp-uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, `temp-ticket-${uniqueSuffix}${extension}`);
  },
});

// Filtro para aceitar apenas PDFs
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Formato de arquivo inválido. Aceito apenas PDF."), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5MB
  },
});

export class TicketController {
  async uploadTicket(req: Request, res: Response) {
    try {
      const { tripId } = req.params;

      // Verificar se o usuário tem acesso à viagem
      const trip = await Trip.findOne({
        _id: tripId,
        user: req.userId,
      });

      if (!trip) {
        return res.status(404).json({ error: "Viagem não encontrada" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado" });
      }

      // Caminho temporário do arquivo
      const tempFilePath = req.file.path;
      const fileName = req.file.originalname;

      try {
        // Fazer upload para o Vercel Blob
        const result = await uploadFile(
          tempFilePath,
          req.userId!,
          tripId,
          fileName
        );

        // Remover o arquivo temporário após o upload
        fs.unlinkSync(tempFilePath);

        // Se já existia uma passagem anterior, excluir
        if (trip.ticketUrl) {
          try {
            await deleteFile(trip.ticketUrl);
          } catch (deleteError) {
            console.error("Erro ao excluir passagem antiga:", deleteError);
            // Continuamos mesmo se houver erro ao excluir a versão antiga
          }
        }

        // Atualizar o documento da viagem com as referências ao arquivo
        trip.ticketUrl = result.url;
        trip.ticketStoragePath = result.pathname;
        trip.ticketName = fileName;
        await trip.save();

        return res.status(200).json({
          message: "Passagem enviada com sucesso",
          ticketUrl: result.url,
          ticketName: fileName,
        });
      } catch (error) {
        // Se houver erro no upload para o Vercel Blob, remover arquivo temporário
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        throw error;
      }
    } catch (error) {
      console.error("Erro ao fazer upload da passagem:", error);
      return res
        .status(500)
        .json({ error: "Erro ao processar o upload da passagem" });
    }
  }

  async getTicket(req: Request, res: Response) {
    try {
      const { tripId } = req.params;

      // Verificar se o usuário tem acesso à viagem
      const trip = await Trip.findOne({
        $or: [
          { _id: tripId, user: req.userId },
          { _id: tripId, "collaborators.userId": req.userId },
        ],
      });

      if (!trip) {
        return res.status(404).json({ error: "Viagem não encontrada" });
      }

      if (!trip.ticketUrl) {
        return res
          .status(404)
          .json({ error: "Passagem não encontrada para esta viagem" });
      }

      // A URL já está armazenada no banco de dados
      return res.status(200).json({
        ticketUrl: trip.ticketUrl,
        ticketName: trip.ticketName,
      });
    } catch (error) {
      console.error("Erro ao obter informações da passagem:", error);
      return res
        .status(500)
        .json({ error: "Erro ao obter informações da passagem" });
    }
  }

  async downloadTicket(req: Request, res: Response) {
    try {
      const { tripId } = req.params;

      // Verificar se o usuário tem acesso à viagem
      const trip = await Trip.findOne({
        $or: [
          { _id: tripId, user: req.userId },
          { _id: tripId, "collaborators.userId": req.userId },
        ],
      });

      if (!trip) {
        return res.status(404).json({ error: "Viagem não encontrada" });
      }

      if (!trip.ticketUrl) {
        return res
          .status(404)
          .json({ error: "Passagem não encontrada para esta viagem" });
      }

      console.log("Tentando baixar passagem:", {
        tripId,
        ticketUrl: trip.ticketUrl,
        ticketName: trip.ticketName,
        ticketStoragePath: trip.ticketStoragePath,
      });

      // Para arquivos do Vercel Blob, fazer download programático
      if (trip.ticketUrl) {
        console.log("Fazendo download do arquivo:", trip.ticketUrl);

        try {
          // Fazer fetch da URL do Vercel Blob
          const fetch = (await import("node-fetch")).default;
          const response = await fetch(trip.ticketUrl);

          if (!response.ok) {
            throw new Error(`Erro ao buscar arquivo: ${response.statusText}`);
          }

          // Definir headers para forçar download
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${trip.ticketName || "passagem.pdf"}"`
          );
          res.setHeader("Cache-Control", "no-cache");

          // Stream do arquivo para o cliente
          if (response.body) {
            response.body.pipe(res);
            return;
          } else {
            throw new Error("Corpo da resposta vazio");
          }
        } catch (fetchError) {
          console.error("Erro ao fazer fetch do arquivo:", fetchError);
          // Fallback: redirecionar para URL original
          return res.redirect(trip.ticketUrl);
        }
      }

      // Se não há URL, retornar erro
      return res.status(404).json({ error: "URL da passagem não encontrada" });
    } catch (error) {
      console.error("Erro ao fazer download da passagem:", error);
      return res
        .status(500)
        .json({ error: "Erro ao fazer download da passagem" });
    }
  }

  async deleteTicket(req: Request, res: Response) {
    try {
      const { tripId } = req.params;

      // Verificar se o usuário tem acesso à viagem
      const trip = await Trip.findOne({
        _id: tripId,
        user: req.userId,
      });

      if (!trip) {
        return res.status(404).json({ error: "Viagem não encontrada" });
      }

      if (!trip.ticketUrl || !trip.ticketStoragePath) {
        return res
          .status(404)
          .json({ error: "Passagem não encontrada para esta viagem" });
      }

      // Excluir o arquivo do Vercel Blob
      await deleteFile(trip.ticketStoragePath);

      // Remover a referência do arquivo no documento da viagem
      trip.ticketUrl = undefined;
      trip.ticketStoragePath = undefined;
      trip.ticketName = undefined;
      await trip.save();

      return res.status(200).json({ message: "Passagem removida com sucesso" });
    } catch (error) {
      console.error("Erro ao remover passagem:", error);
      return res.status(500).json({ error: "Erro ao remover passagem" });
    }
  }
}
