import { PrismaService } from "src/prisma/prisma.service";
import { CashierController } from "./cashier.controller";
import { CashierService } from "./cashier.service";
import { Module } from "@nestjs/common";

@Module({
    controllers: [CashierController],
    providers: [PrismaService,CashierService],
    exports: [CashierService],
})
export class CashierModule{}


