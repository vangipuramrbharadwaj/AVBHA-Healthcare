import { prisma } from "../../database/prisma";

export const operationTheatreRepository = {
  findBookingById(hospitalId: string, id: string) {
    return prisma.otBooking.findFirst({
      where: { id, hospitalId },
    });
  },

  listRooms(hospitalId: string, branchId?: string) {
    return prisma.otRoom.findMany({
      where: {
        hospitalId,
        ...(branchId ? { branchId } : {}),
      },
      orderBy: { roomName: "asc" },
    });
  },

  listProcedures(hospitalId: string) {
    return prisma.otProcedureCatalog.findMany({
      where: {
        hospitalId,
        deletedAt: null,
        status: "ACTIVE",
      },
      orderBy: { procedureName: "asc" },
    });
  },
};
