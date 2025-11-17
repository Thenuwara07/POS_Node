import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import type { Request } from "express";

import { AuthGuard } from "@nestjs/passport";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { Role } from "../../generated/prisma-client";

import { ReportsService } from "./services/reports.service";
import { CreditSalesService } from "./services/credit-sales.service";
import { DiscountReportService } from "./services/discount-report.service";
import { UnpaidPurchasesService } from "./services/unpaid-purchases.service";
import { TransactionHistoryService } from "./services/transaction-history.service";
import { RefundBillsService } from './services/refund-bills.service';
import { RefundBillsReportQueryDto } from './dto/refund-bills-report.dto';


import { ProfitMarginReportQueryDto } from "./dto/profit-margin-report.dto";
import { CreditSalesReportQueryDto } from "./dto/credit-sales-report.dto";
import { DiscountReportQueryDto } from "./dto/discount-report.dto";
import { UnpaidPurchasesReportQueryDto } from "./dto/unpaid-purchases-report.dto";
import { TransactionHistoryReportQueryDto } from "./dto/transaction-history-report.dto";

import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from "@nestjs/swagger";

@ApiTags("Manager Reports")
@ApiBearerAuth("JWT-auth")
@Controller("manager/reports")
@UseGuards(AuthGuard("jwt"), RolesGuard)
@Roles(Role.MANAGER)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly creditSalesService: CreditSalesService,
    private readonly discountReportService: DiscountReportService,
    private readonly unpaidPurchasesService: UnpaidPurchasesService,
    private readonly transactionHistoryService: TransactionHistoryService,
    private readonly refundBillsService: RefundBillsService,
  ) {}

  @Get("profit-margin")
  @ApiOperation({ summary: "Get profit & margin per invoice for a date range" })
  @ApiOkResponse({ description: "Successfully returned profit & margin list" })
  @ApiUnauthorizedResponse({ description: "Unauthorized (no / invalid token)" })
  @ApiForbiddenResponse({ description: "Forbidden (role is not MANAGER)" })
  async getProfitMargin(
    @Query() query: ProfitMarginReportQueryDto,
    @Req() req: Request,
  ) {
    const user: any = (req as any).user;
    const userId: number | undefined = user?.id ?? user?.sub;

    const data = await this.reportsService.getProfitMarginReport(query, userId);
    return { data };
  }

  @Get("credit-sales")
  @ApiOperation({ summary: "Get credit sales for a date range" })
  @ApiOkResponse({ description: "Successfully returned credit sales list" })
  @ApiUnauthorizedResponse({ description: "Unauthorized (no / invalid token)" })
  @ApiForbiddenResponse({ description: "Forbidden (role is not MANAGER)" })
  async getCreditSales(
    @Query() query: CreditSalesReportQueryDto,
    @Req() req: Request,
  ) {
    const user: any = (req as any).user;
    const userId: number | undefined = user?.id ?? user?.sub;

    const data = await this.creditSalesService.getCreditSalesReport(
      query,
      userId,
    );
    return { data };
  }

  @Get("discount-granted")
  @ApiOperation({ summary: "Get discount granted per invoice for a date range" })
  @ApiOkResponse({ description: "Successfully returned discount report list" })
  @ApiUnauthorizedResponse({ description: "Unauthorized (no / invalid token)" })
  @ApiForbiddenResponse({ description: "Forbidden (role is not MANAGER)" })
  async getDiscountGranted(
    @Query() query: DiscountReportQueryDto,
    @Req() req: Request,
  ) {
    const user: any = (req as any).user;
    const userId: number | undefined = user?.id ?? user?.sub;

    const data = await this.discountReportService.getDiscountReport(
      query,
      userId,
    );
    return { data };
  }

  @Get("unpaid-purchases")
  @ApiOperation({ summary: "Get unpaid supplier purchases for a date range" })
  @ApiOkResponse({ description: "Successfully returned unpaid purchases list" })
  @ApiUnauthorizedResponse({ description: "Unauthorized (no / invalid token)" })
  @ApiForbiddenResponse({ description: "Forbidden (role is not MANAGER)" })
  async getUnpaidPurchases(
    @Query() query: UnpaidPurchasesReportQueryDto,
    @Req() req: Request,
  ) {
    const user: any = (req as any).user;
    const userId: number | undefined = user?.id ?? user?.sub;

    const data = await this.unpaidPurchasesService.getUnpaidPurchasesReport(
      query,
      userId,
    );
    return { data };
  }

  @Get("transactions")
  @ApiOperation({ summary: "Get payment transactions for a date range" })
  @ApiOkResponse({ description: "Successfully returned transaction history list" })
  @ApiUnauthorizedResponse({ description: "Unauthorized (no / invalid token)" })
  @ApiForbiddenResponse({ description: "Forbidden (role is not MANAGER)" })
  async getTransactions(
    @Query() query: TransactionHistoryReportQueryDto,
    @Req() req: Request,
  ) {
    const user: any = (req as any).user;
    const userId: number | undefined = user?.id ?? user?.sub;

    const data = await this.transactionHistoryService.getTransactionHistory(
      query,
      userId,
    );

    return { data };
  }
    @Get('refund-bills')
  @ApiOperation({ summary: 'Get refund bills for a date range' })
  @ApiOkResponse({ description: 'Successfully returned refund bills list' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized (no / invalid token)' })
  @ApiForbiddenResponse({ description: 'Forbidden (role is not MANAGER)' })
  async getRefundBills(
    @Query() query: RefundBillsReportQueryDto,
    @Req() req: Request,
  ) {
    const user: any = (req as any).user;
    const userId: number | undefined = user?.id ?? user?.sub;

    const data = await this.refundBillsService.getRefundBillsReport(
      query,
      userId,
    );

    return { data };
  }

}