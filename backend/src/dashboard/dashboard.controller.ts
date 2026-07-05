import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: '获取 Dashboard 数据' })
  getDashboard() {
    return this.dashboardService.getDashboard();
  }
}
