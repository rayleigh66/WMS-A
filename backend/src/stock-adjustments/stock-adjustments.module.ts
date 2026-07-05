import { Module } from '@nestjs/common';
import { StockAdjustmentsController } from './stock-adjustments.controller';
import { StockAdjustmentsService } from './stock-adjustments.service';
import { OperationLogsModule } from '../operation-logs/operation-logs.module';

@Module({
  imports: [OperationLogsModule],
  controllers: [StockAdjustmentsController],
  providers: [StockAdjustmentsService],
})
export class StockAdjustmentsModule {}
