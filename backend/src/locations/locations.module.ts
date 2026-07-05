import { Module } from '@nestjs/common';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { OperationLogsModule } from '../operation-logs/operation-logs.module';

@Module({
  imports: [OperationLogsModule],
  controllers: [LocationsController],
  providers: [LocationsService],
  exports: [LocationsService],
})
export class LocationsModule {}
