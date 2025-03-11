import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { users } from './entities/users.entity';

@Module({
  imports:[
    TypeOrmModule.forFeature([users]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
