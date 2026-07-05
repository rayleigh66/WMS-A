import { Module, Global } from "@nestjs/common";
import { OperationLogsService } from "./operation-logs.service";
import { OperationLogsController } from "./operation-logs.controller";

@Global()
@Module({
  controllers: [OperationLogsController],
  providers: [OperationLogsService],
  exports: [OperationLogsService],
})
export class OperationLogsModule {}
