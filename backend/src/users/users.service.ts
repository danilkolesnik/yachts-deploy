import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { users } from 'src/auth/entities/users.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(users)
    private readonly usersRepository: Repository<users>,
  ) {}

  async allUsers() {
    try {
      const allUsers = await this.usersRepository.find();
      return {
        code: 200,
        data: allUsers,
      };
    } catch (err) {
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }

  async findAllUsersWithRoleUser() {
    try {
      const usersWithRoleUser = await this.usersRepository.find({
        where: { role: 'user' },
      });
      return {
        code: 200,
        data: usersWithRoleUser,
      };
    } catch (err) {
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }

  async updateUserRole(id: string, newRole: string) {
    try {
      // Directly find the user by the provided id
      const user = await this.usersRepository.findOne({ where: { id } });

      if (!user) {
        return {
          code: 404,
          message: 'User not found',
        };
      }

      user.role = newRole;
      const updatedUser = await this.usersRepository.save(user);

      return {
        code: 200,
        data: updatedUser,
      };
    } catch (err) {
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }
}