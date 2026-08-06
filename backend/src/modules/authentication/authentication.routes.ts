import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import {
  changePasswordController,
  loginController,
  logoutAllController,
  logoutController,
  meController,
  refreshController,
} from "./authentication.controller";

export const authenticationRouter = Router();

authenticationRouter.post("/login", loginController);
authenticationRouter.post("/refresh", refreshController);

authenticationRouter.use(authenticate);

authenticationRouter.get("/me", meController);
authenticationRouter.post("/logout", logoutController);
authenticationRouter.post("/logout-all", logoutAllController);
authenticationRouter.post("/change-password", changePasswordController);
