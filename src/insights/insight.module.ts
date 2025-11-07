import { Module } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { InsightController } from "./insight.controller";
import { InsightService } from "./insight.service";

@Module({
    controllers: [InsightController],
    providers: [PrismaService, InsightService],
})
export class InsightModule {}