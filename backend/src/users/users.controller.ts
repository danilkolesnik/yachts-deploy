import { Controller, Get, Put, Param, Body, Delete, Req, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { Permissions } from 'src/auth/permissions.decorator';
import { PermissionsList } from 'src/constants/permissions';
import { Request } from 'express';
import getBearerToken from 'src/methods/getBearerToken';
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions(PermissionsList.USERS_READ)
  async getAllUsers() {
    return this.usersService.allUsers();
  }

  @Get('history')
  @Permissions(PermissionsList.USERS_AUDIT_READ)
  async getAllUsersHistory(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('targetUserId') targetUserId?: string,
    @Query('actorName') actorName?: string,
    @Query('actorRole') actorRole?: string,
    @Query('type') type?: string,
  ) {
    return this.usersService.getAllUsersHistory({
      from,
      to,
      targetUserId,
      actorName,
      actorRole,
      type,
    });
  }

  @Get('role/worker')
  @Permissions(PermissionsList.USERS_READ)
  async getWorkers() {
    return this.usersService.findAllUsersExcludingRoles();
  }

  @Get('role/user')
  @Permissions(PermissionsList.USERS_READ)
  async getUsersWithRoleUser() {
    return this.usersService.findAllUsers();
  }

  @Get(':id/history')
  @Permissions(PermissionsList.USERS_AUDIT_READ)
  async getUserHistory(
    @Param('id') id: string,
    @Req() req: Request,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('actorName') actorName?: string,
    @Query('actorRole') actorRole?: string,
    @Query('type') type?: string,
  ) {
    return this.usersService.getUserHistory(id, {
      from,
      to,
      actorName,
      actorRole,
      type,
      req,
    });
  }

  @Put(':id/role')
  @Permissions(PermissionsList.USERS_MANAGE)
  async updateUserRole(
    @Param('id') id: string,
    @Body('role') newRole: string,
    @Req() req: Request,
  ) {
    const token = getBearerToken(req);
    let changedBy: string | undefined;
    try {
      if (token) {
        const login = jwt.verify(token, process.env.SECRET_KEY) as JwtPayload;
        changedBy = String(login.id);
      }
    } catch {}
    return this.usersService.updateUserRole(id, newRole, changedBy);
  }

  @Put(':id/profile')
  @Permissions(PermissionsList.USERS_PERMISSIONS_MANAGE)
  async upsertEmployeeProfile(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    const token = getBearerToken(req);
    let changedBy: string | undefined;
    try {
      if (token) {
        const login = jwt.verify(token, process.env.SECRET_KEY) as JwtPayload;
        changedBy = String(login.id);
      }
    } catch {}
    return this.usersService.upsertEmployeeProfile(id, body, changedBy);
  }

  @Put(':id')
  @Permissions(PermissionsList.USERS_MANAGE)
  async updateUser(@Param('id') id: string, @Body() body: any, @Req() req: Request) {
    const token = getBearerToken(req);
    let changedBy: string | undefined;
    try {
      if (token) {
        const login = jwt.verify(token, process.env.SECRET_KEY) as JwtPayload;
        changedBy = String(login.id);
      }
    } catch {}
    return this.usersService.updateUser(id, body, changedBy);
  }

  @Delete(':id')
  @Permissions(PermissionsList.USERS_MANAGE)
  async deleteUser(@Param('id') id: string, @Req() req: Request) {
    const token = getBearerToken(req);
    let changedBy: string | undefined;
    try {
      if (token) {
        const login = jwt.verify(token, process.env.SECRET_KEY) as JwtPayload;
        changedBy = String(login.id);
      }
    } catch {}
    return this.usersService.deleteUser(id, changedBy);
  }

  @Get(':id/profile')
  @Permissions(PermissionsList.USERS_READ)
  async getEmployeeProfile(@Param('id') id: string) {
    return this.usersService.getEmployeeProfile(id);
  }
}