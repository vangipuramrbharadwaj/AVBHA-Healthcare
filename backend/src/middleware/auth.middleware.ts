import type {
  NextFunction,
  Request,
  Response,
} from "express";
import { prisma } from "../database/prisma";
import { AppError } from "../shared/errors/app-error";
import { verifyAccessToken } from "../shared/security/tokens";

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authorization = req.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      throw new AppError(
        "Authentication is required",
        401,
        "AUTHENTICATION_REQUIRED",
      );
    }

    const token = authorization
      .slice("Bearer ".length)
      .trim();

    const claims = verifyAccessToken(token);

    const userId = claims.sub;
    const hospitalId = claims.hospitalId;
    const sessionId = claims.sessionId;

    const session =
      await prisma.userSession.findFirst({
        where: {
          id: sessionId,
          userId,
          hospitalId,
          status: "ACTIVE",
          revokedAt: null,
          expiresAt: {
            gt: new Date(),
          },
          user: {
            status: "ACTIVE",
            deletedAt: null,
            hospital: {
              active: true,
              deletedAt: null,
            },
          },
        },
      });

    if (!session) {
      throw new AppError(
        "Session is invalid or has been revoked",
        401,
        "INVALID_SESSION",
      );
    }

    req.auth = {
      userId,
      hospitalId,
      ...(claims.branchId
        ? { branchId: claims.branchId }
        : {}),
      sessionId,
      roles: claims.roles,
      permissions: claims.permissions,
      mustChangePassword:
        claims.mustChangePassword,
    };

    await prisma.userSession.update({
      where: {
        id: session.id,
      },
      data: {
        lastActivityAt: new Date(),
      },
    });

    next();
  } catch (error) {
    next(error);
  }
}