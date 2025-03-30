import { Router } from "express";
import { TripController } from "./controllers/TripController";
import { UserController } from "./controllers/UserController";
import { authMiddleware } from "./middlewares/auth";

const router = Router();
const tripController = new TripController();
const userController = new UserController();

// Auth routes
router.post("/auth/register", userController.register);
router.post("/auth/login", userController.login);
router.post("/auth/google", userController.googleLogin);
router.post("/auth/forgot-password", userController.forgotPassword);
router.post("/auth/reset-password", userController.resetPassword);

// Public Trip routes
router.get("/trips/:id/public", tripController.showPublic);
router.post("/trips/:id/confirm", tripController.confirmParticipation);
router.get("/trips/:id/guest/:accessId", tripController.showGuestAccess); // Nova rota para acesso do convidado

// Protected Trip routes
router.use("/trips", authMiddleware);
router.post("/trips", tripController.create);
router.get("/trips/:id", tripController.show);
router.get("/trips", tripController.index);
router.patch("/trips/:id", tripController.update);
router.delete("/trips/:id", tripController.delete);
router.post("/trips/:id/invite", tripController.sendInvitation);
router.post("/trips/:id/guests", tripController.addGuest); // Nova rota para adicionar convidado

export { router };
