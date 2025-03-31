import { Request, Response } from "express";
import { Trip, ITrip } from "../models/Trip";
import { User } from "../models/User";
import { sendMail } from "../services/mail";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

// Extended Guest interface that includes both model and runtime properties
interface Guest {
  name: string;
  accessId: string;
  email?: string;
  confirmed?: boolean;
  confirmedAt?: Date;
  userId?: mongoose.Types.ObjectId;
  permissions: {
    canEdit: boolean;
    canInvite: boolean;
  };
}

// Interface for collaborator
interface Collaborator {
  userId: {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
  };
  permissions: {
    canEdit: boolean;
    canInvite: boolean;
  };
}

// Interface for the guest invitation payload
interface GuestInvitation {
  name: string;
  email: string;
}

// Interface for organizer data
interface Organizer {
  name: string;
  email: string;
}

export class TripController {
  async create(req: Request, res: Response) {
    try {
      const { destination, date, isDraft } = req.body;
      const trip = await Trip.create({
        destination,
        date,
        isDraft,
        user: req.userId,
        guests: [],
      });
      return res.status(201).json(trip);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async show(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const trip = await Trip.findOne({ _id: id, user: req.userId });

      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }

      return res.json(trip);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async index(req: Request, res: Response) {
    try {
      const trips = await Trip.find({ user: req.userId }).sort({
        createdAt: -1,
      });
      return res.json(trips);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { destination, date, guests, isDraft } = req.body;

      const trip = await Trip.findOne({
        $or: [
          { _id: id, user: req.userId },
          { _id: id, "collaborators.userId": req.userId },
        ],
      });

      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }

      // Verificar permissão para editar
      const collaborator = trip.collaborators.find(
        (c) => c.userId.toString() === req.userId
      );
      if (
        trip.user.toString() !== req.userId &&
        (!collaborator || !collaborator.permissions.canEdit)
      ) {
        return res
          .status(403)
          .json({ error: "You don't have permission to edit this trip" });
      }

      const updatedTrip = await Trip.findOneAndUpdate(
        { _id: id },
        {
          destination,
          date,
          guests,
          isDraft,
        },
        { new: true }
      ).populate("user collaborators.userId", "name email");

      return res.json(updatedTrip);
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const trip = await Trip.findOneAndDelete({ _id: id, user: req.userId });

      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }

      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async sendInvitation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { guests }: { guests: GuestInvitation[] } = req.body;

      const trip = await Trip.findOne({
        $or: [
          { _id: id, user: req.userId },
          { _id: id, "collaborators.userId": req.userId },
        ],
      }).populate<{ user: Organizer }>("user", "name email");

      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }

      // Verificar permissão para convidar
      const collaborator = trip.collaborators.find(
        (c) => c.userId.toString() === req.userId
      );
      if (
        trip.user.toString() !== req.userId &&
        (!collaborator || !collaborator.permissions.canInvite)
      ) {
        return res
          .status(403)
          .json({ error: "You don't have permission to invite users" });
      }

      // Validar se já existem convidados com os mesmos emails
      const existingEmails = trip.guests.map((g) => g.email);
      const newGuests = guests.filter(
        (guest) => !existingEmails.includes(guest.email)
      );

      if (newGuests.length === 0) {
        return res
          .status(400)
          .json({ error: "All guests are already invited" });
      }

      // Adicionar novos convidados
      const newGuestData: Guest[] = newGuests.map((guest) => ({
        name: guest.name,
        email: guest.email,
        accessId: uuidv4(),
        confirmed: false,
        permissions: {
          canEdit: true,
          canInvite: true,
        },
      }));

      trip.guests.push(...newGuestData);

      await trip.save();

      // Gerar links de compartilhamento personalizados
      const shareLinks = newGuests.map((guest) => ({
        name: guest.name,
        email: guest.email,
        shareUrl: `${process.env.FRONTEND_URL}/trip/invite/${
          trip._id
        }?email=${encodeURIComponent(guest.email)}`,
      }));

      return res.json({
        message: "Guests added successfully",
        shareLinks,
      });
    } catch (error) {
      console.error("Error adding guests:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async showPublic(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { email } = req.query as { email?: string };

      const trip = await Trip.findById(id)
        .populate<{ user: Organizer }>("user", "name email")
        .populate<{ collaborators: Collaborator[] }>(
          "collaborators.userId",
          "name email"
        );

      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }

      const guest = email ? trip.guests.find((g) => g.email === email) : null;
      const isInvited = Boolean(guest);

      const tripData = {
        destination: trip.destination,
        date: trip.date,
        organizer: trip.user,
        collaborators: trip.collaborators.map((c) => ({
          id: c.userId._id,
          name: c.userId.name,
          email: c.userId.email,
          permissions: c.permissions,
        })),
      };

      return res.json({
        trip: tripData,
        guest: isInvited ? guest : null,
      });
    } catch (error) {
      console.error("Error in showPublic:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async confirmParticipation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { email } = req.body;

      const trip = await Trip.findById(id).populate("user", "email");
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }

      const guestIndex = trip.guests.findIndex((g) => g.email === email);
      if (guestIndex === -1) {
        return res.status(404).json({ error: "Guest not found" });
      }

      // Atualizar status do convidado e associar ao usuário
      trip.guests[guestIndex].confirmed = true;
      trip.guests[guestIndex].confirmedAt = new Date();
      trip.guests[guestIndex].userId = new mongoose.Types.ObjectId(req.userId);

      // Adicionar como colaborador se ainda não for
      const isCollaborator = trip.collaborators.some(
        (c) => c.userId.toString() === req.userId
      );
      if (!isCollaborator) {
        trip.collaborators.push({
          userId: new mongoose.Types.ObjectId(req.userId),
          permissions: trip.guests[guestIndex].permissions,
        });
      }

      await trip.save();

      // Notificar o organizador
      const organizer = trip.user as any;
      await sendMail({
        to: organizer.email,
        subject: "Confirmação de participação - plann.er",
        text: `${email} confirmou participação na sua viagem para ${trip.destination}!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #84cc16;">Novo participante confirmado!</h1>
            <p>${email} confirmou participação na sua viagem.</p>
            <div style="background-color: #18181b; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="color: #fff; margin: 8px 0;">Destino: ${trip.destination}</p>
              <p style="color: #fff; margin: 8px 0;">Data: ${trip.date}</p>
            </div>
          </div>
        `,
      });

      return res.json({ message: "Participation confirmed successfully" });
    } catch (error) {
      console.error("Error confirming participation:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async addGuest(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, email } = req.body;

      const trip = await Trip.findOne({
        $or: [
          { _id: id, user: req.userId },
          { _id: id, "collaborators.userId": req.userId },
        ],
      });

      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }

      // Verificar permissão para convidar
      const collaborator = trip.collaborators.find(
        (c) => c.userId.toString() === req.userId
      );
      if (
        trip.user.toString() !== req.userId &&
        (!collaborator || !collaborator.permissions.canInvite)
      ) {
        return res
          .status(403)
          .json({ error: "You don't have permission to invite users" });
      }

      // Gerar UUID único para o convidado
      const accessId = uuidv4();

      // Adicionar novo convidado
      const newGuest: Guest = {
        name,
        email,
        accessId,
        confirmed: false,
        permissions: {
          canEdit: true,
          canInvite: true,
        },
      };

      trip.guests.push(newGuest);
      await trip.save();

      // Gerar link de compartilhamento personalizado
      const shareUrl = `${process.env.FRONTEND_URL}/trip/guest/${
        trip._id
      }/${accessId}?name=${encodeURIComponent(name)}`;

      return res.json({
        message: "Guest added successfully",
        shareUrl,
        guest: {
          name,
          accessId,
          email,
        },
      });
    } catch (error) {
      console.error("Error adding guest:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async showGuestAccess(req: Request, res: Response) {
    try {
      const { id, accessId } = req.params;

      const trip = await Trip.findById(id)
        .populate("user", "name")
        .select("destination date guests user");

      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }

      const guest = trip.guests.find((g) => g.accessId === accessId);
      if (!guest) {
        return res.status(404).json({ error: "Guest access not found" });
      }

      return res.json({
        trip: {
          destination: trip.destination,
          date: trip.date,
          organizer: trip.user,
        },
        guest,
      });
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}
