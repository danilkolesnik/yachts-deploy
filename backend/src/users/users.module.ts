import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { users } from 'src/auth/entities/users.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeProfile } from './entities/employee-profile.entity';
import { UserPermissionHistory } from './entities/user-permission-history.entity';
import { UserAuditHistory } from './entities/user-audit-history.entity';
import { OrderStatusHistory } from 'src/order/entities/order-status-history.entity';
import { OrderAssignmentHistory } from 'src/order/entities/order-assignment-history.entity';
import { PermissionsGuard } from './permissions.guard';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      users,
      EmployeeProfile,
      UserPermissionHistory,
      UserAuditHistory,
      OrderStatusHistory,
      OrderAssignmentHistory,
    ]),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class UsersModule {}
