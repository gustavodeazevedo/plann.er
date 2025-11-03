import { Router } from "express";
import { TripController } from "./controllers/TripController";
import { UserController } from "./controllers/UserController";
import { ChecklistController } from "./controllers/ChecklistController";
import { TicketController, upload } from "./controllers/TicketController";
import { authMiddleware } from "./middlewares/auth";

const router = Router();
const tripController = new TripController();
const userController = new UserController();
const checklistController = new ChecklistController();
const ticketController = new TicketController();

// Health check route (para warm-up do servidor)
router.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Auth routes
router.post("/auth/register", userController.register);
router.post("/auth/login", userController.login);
router.post("/auth/google", userController.googleLogin);
router.post("/auth/forgot-password", userController.forgotPassword);
router.post("/auth/reset-password", userController.resetPassword);

// Public Trip routes
router.get("/trips/:id/public", tripController.showPublic);
router.post("/trips/:id/confirm", tripController.confirmParticipation);
router.post(
  "/trips/:id/confirm-access",
  tripController.confirmAccessParticipation
); // Nova rota para confirmar participação via accessId
router.get("/trips/:id/guest/:accessId", tripController.showGuestAccess); // Nova rota para acesso do convidado

// Protected Trip routes
router.use("/trips", authMiddleware);
router.post("/trips", tripController.create);
router.get("/trips/shared/with-me", tripController.listSharedTrips); // Movida para antes da rota com ID dinâmico
router.get("/trips/:id", tripController.show);
router.get("/trips", tripController.index);
router.patch("/trips/:id", tripController.update);
router.delete("/trips/:id", tripController.delete);
router.post("/trips/:id/invite", tripController.sendInvitation);
router.post("/trips/:id/guests", tripController.addGuest); // Nova rota para adicionar convidado

// Rotas para gerenciamento de convidados
router.get("/trips/:id/guests", tripController.listGuests); // Listar convidados
router.put("/trips/:id/guests/:guestId", tripController.updateGuest); // Editar convidado
router.delete("/trips/:id/guests/:guestId", tripController.deleteGuest); // Remover convidado

// Rotas para o checklist
router.get(
  "/trips/:tripId/checklist",
  authMiddleware,
  checklistController.index
);
router.post(
  "/trips/:tripId/checklist",
  authMiddleware,
  checklistController.create
);
router.patch(
  "/trips/:tripId/checklist/:id",
  authMiddleware,
  checklistController.update
);
router.delete(
  "/trips/:tripId/checklist/:id",
  authMiddleware,
  checklistController.delete
);

// Rotas para gerenciamento de tasks
router.post("/trips/:id/tasks", authMiddleware, tripController.addTask);
router.put(
  "/trips/:id/tasks/:taskId",
  authMiddleware,
  tripController.updateTask
);
router.delete(
  "/trips/:id/tasks/:taskId",
  authMiddleware,
  tripController.deleteTask
);

// Rotas para gerenciamento de passagens
router.post(
  "/trips/:tripId/ticket",
  authMiddleware,
  upload.single("ticket") as any,
  ticketController.uploadTicket
);
router.get("/trips/:tripId/ticket", authMiddleware, ticketController.getTicket);
router.get(
  "/trips/:tripId/ticket/download",
  authMiddleware,
  ticketController.downloadTicket
);
router.delete(
  "/trips/:tripId/ticket",
  authMiddleware,
  ticketController.deleteTicket
);

export { router };
