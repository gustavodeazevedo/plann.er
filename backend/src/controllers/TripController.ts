import { Request, Response } from "express";
import { Trip, ITrip } from "../models/Trip";
import { User } from "../models/User";
import { sendMail } from "../services/mail";

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

      const trip = await Trip.findOneAndUpdate(
        { _id: id, user: req.userId },
        {
          destination,
          date,
          guests,
          isDraft,
        },
        { new: true }
      );

      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }

      return res.json(trip);
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
      const { email } = req.body;

      const trip = await Trip.findOne({ _id: id, user: req.userId });
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }

      // Verificar se o email já foi convidado
      const isAlreadyInvited = trip.guests.some(
        (guest) => guest.email === email
      );
      if (isAlreadyInvited) {
        return res.status(400).json({ error: "Guest already invited" });
      }

      // Adicionar novo convidado
      trip.guests.push({ email, confirmed: false });
      await trip.save();

      const inviteUrl = `${process.env.FRONTEND_URL}/trip/invite/${trip._id}`;

      await sendMail({
        to: email,
        subject: "Convite para viagem - plann.er",
        text: `Você foi convidado para uma viagem para ${trip.destination} no dia ${trip.date}. Acesse o link para confirmar sua participação: ${inviteUrl}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #84cc16;">Convite para viagem</h1>
            <p>Você foi convidado para uma viagem!</p>
            <div style="background-color: #18181b; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="color: #fff; margin: 8px 0;">Destino: ${trip.destination}</p>
              <p style="color: #fff; margin: 8px 0;">Data: ${trip.date}</p>
            </div>
            <a href="${inviteUrl}" style="display: inline-block; background-color: #84cc16; color: #1a2e05; text-decoration: none; padding: 12px 24px; border-radius: 8px; margin: 16px 0;">
              Confirmar participação
            </a>
          </div>
        `,
      });

      return res.json({ message: "Invitation sent successfully" });
    } catch (error) {
      console.error("Error sending invitation:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async showPublic(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { email } = req.query;

      const trip = await Trip.findById(id).populate("user", "name email");

      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }

      const guest = trip.guests.find((g) => g.email === email);
      const isInvited = Boolean(guest);

      return res.json({
        trip: {
          destination: trip.destination,
          date: trip.date,
          organizer: trip.user,
        },
        guest: isInvited ? guest : null,
      });
    } catch (error) {
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

      // Atualizar status do convidado
      trip.guests[guestIndex].confirmed = true;
      trip.guests[guestIndex].confirmedAt = new Date();
      await trip.save();

      // Notificar o organizador
      const organizer = trip.user as any; // Necessário devido ao populate
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
}
