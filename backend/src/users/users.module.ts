import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { users } from 'src/auth/entities/users.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([users])],
  controllers: [UsersController],
  providers: [UsersService]
})
export class UsersModule {}
