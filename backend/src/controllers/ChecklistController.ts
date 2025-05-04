import { Request, Response } from "express";
import mongoose from "mongoose";
import { ChecklistItem } from "../models/ChecklistItem";
import { Trip } from "../models/Trip";

export class ChecklistController {
  async index(req: Request, res: Response) {
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
        return res.status(404).json({ error: "Trip not found" });
      }

      const items = await ChecklistItem.find({ tripId }).sort({ createdAt: 1 });

      return res.json({ items });
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { tripId } = req.params;
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      // Verificar se o usuário tem acesso à viagem
      const trip = await Trip.findOne({
        $or: [
          { _id: tripId, user: req.userId },
          { _id: tripId, "collaborators.userId": req.userId },
        ],
      });

      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }

      const checklistItem = await ChecklistItem.create({
        tripId,
        text,
        checked: false,
      });

      return res.status(201).json(checklistItem);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { tripId, id } = req.params;
      const { checked } = req.body;

      if (checked === undefined) {
        return res.status(400).json({ error: "Checked status is required" });
      }

      // Verificar se o usuário tem acesso à viagem
      const trip = await Trip.findOne({
        $or: [
          { _id: tripId, user: req.userId },
          { _id: tripId, "collaborators.userId": req.userId },
        ],
      });

      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }

      const checklistItem = await ChecklistItem.findOneAndUpdate(
        { _id: id, tripId },
        { checked },
        { new: true }
      );

      if (!checklistItem) {
        return res.status(404).json({ error: "Checklist item not found" });
      }

      return res.json(checklistItem);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { tripId, id } = req.params;

      // Verificar se o usuário tem acesso à viagem
      const trip = await Trip.findOne({
        $or: [
          { _id: tripId, user: req.userId },
          { _id: tripId, "collaborators.userId": req.userId },
        ],
      });

      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }

      const checklistItem = await ChecklistItem.findOneAndDelete({
        _id: id,
        tripId,
      });

      if (!checklistItem) {
        return res.status(404).json({ error: "Checklist item not found" });
      }

      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}
