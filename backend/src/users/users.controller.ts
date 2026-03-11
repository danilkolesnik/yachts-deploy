import { Controller, Get, Put, Param, Body } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllUsers() {
    return this.usersService.allUsers();
  }

  @Get('role/worker')
  async getWorkers() {
    return this.usersService.findAllUsersExcludingRoles();
  }

  @Get('role/user')
  async getUsersWithRoleUser() {
    return this.usersService.findAllUsers();
  }


  @Put(':id/role')
  async updateUserRole(
    @Param('id') id: string,
    @Body('role') newRole: string,
  ) {
    return this.usersService.updateUserRole(id, newRole);
  }

  @Put(':id/profile')
  async upsertEmployeeProfile(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.usersService.upsertEmployeeProfile(id, body);
  }

  @Get(':id/profile')
  async getEmployeeProfile(@Param('id') id: string) {
    return this.usersService.getEmployeeProfile(id);
  }
}