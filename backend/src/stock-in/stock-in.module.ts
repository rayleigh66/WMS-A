import { Module } from "@nestjs/common";
import { StockInController } from "./stock-in.controller";
import { StockInService } from "./stock-in.service";
import { OperationLogsModule } from "../operation-logs/operation-logs.module";

@Module({
  imports: [OperationLogsModule],
  controllers: [StockInController],
  providers: [StockInService],
})
export class StockInModule {}
