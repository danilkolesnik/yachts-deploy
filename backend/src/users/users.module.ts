import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { users } from 'src/auth/entities/users.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeProfile } from './entities/employee-profile.entity';
import { UserPermissionHistory } from './entities/user-permission-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([users, EmployeeProfile, UserPermissionHistory])],
  controllers: [UsersController],
  providers: [UsersService]
})
export class UsersModule {}
