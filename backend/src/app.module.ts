import { Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_PIPE, APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ItemsModule } from './items/items.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { LocationsModule } from './locations/locations.module';
import { InventoryModule } from './inventory/inventory.module';
import { StockInModule } from './stock-in/stock-in.module';
import { StockOutModule } from './stock-out/stock-out.module';
import { StockAdjustmentsModule } from './stock-adjustments/stock-adjustments.module';
import { StockMovementsModule } from './stock-movements/stock-movements.module';
import { OperationLogsModule } from './operation-logs/operation-logs.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthModule } from './health/health.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { JwtAuthGuard } from './common/jwt-auth.guard';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ItemsModule,
    WarehousesModule,
    LocationsModule,
    InventoryModule,
    StockInModule,
    StockOutModule,
    StockAdjustmentsModule,
    StockMovementsModule,
    OperationLogsModule,
    DashboardModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
          disableErrorMessages: process.env.NODE_ENV === 'production',
        }),
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
