import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { users } from './entities/users.entity';
import { EmployeeProfile } from 'src/users/entities/employee-profile.entity';

@Module({
  imports:[
    TypeOrmModule.forFeature([users, EmployeeProfile]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
