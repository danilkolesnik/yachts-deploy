import { Controller, Get, Put, Param, Body } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllUsers() {
    return this.usersService.allUsers();
  }

  @Get('role/user')
  async getUsersWithRoleUser() {
    return this.usersService.findAllUsersWithRoleUser();
  }

  @Put(':id/role')
  async updateUserRole(
    @Param('id') id: string,
    @Body('role') newRole: string,
  ) {
    return this.usersService.updateUserRole(id, newRole);
  }
}