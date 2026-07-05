import { Module } from '@nestjs/common';
import { StockOutController } from './stock-out.controller';
import { StockOutService } from './stock-out.service';
import { OperationLogsModule } from '../operation-logs/operation-logs.module';

@Module({
  imports: [OperationLogsModule],
  controllers: [StockOutController],
  providers: [StockOutService],
})
export class StockOutModule {}
