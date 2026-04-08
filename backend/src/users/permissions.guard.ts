import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from 'src/auth/permissions.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { users } from 'src/auth/entities/users.entity';
import { EmployeeProfile } from './entities/employee-profile.entity';
import getBearerToken from 'src/methods/getBearerToken';
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
import { PermissionsList } from 'src/constants/permissions';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(users)
    private readonly usersRepository: Repository<users>,
    @InjectRepository(EmployeeProfile)
    private readonly employeeProfileRepository: Repository<EmployeeProfile>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

    // Если для маршрута не заданы permissions — пропускаем запрос
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = getBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Authorization token missing');
    }

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, process.env.SECRET_KEY) as JwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    const userId = String(payload.id);

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Админ может всё
    if (user.role === 'admin') {
      return true;
    }

    const profile = await this.employeeProfileRepository.findOne({
      where: { userId },
    });

    // If profile is missing, fall back to role defaults
    const roleDefaults: Record<string, string[]> = {
      manager: [
        PermissionsList.ORDERS_READ,
        PermissionsList.ORDERS_CREATE,
        PermissionsList.ORDERS_STATUS_CHANGE,
        PermissionsList.ORDERS_ASSIGNMENT_MANAGE,
        PermissionsList.ORDERS_MEDIA_ADD,
        PermissionsList.ORDERS_MEDIA_DELETE,
        PermissionsList.ORDERS_COMMENT_ADD,
        PermissionsList.USERS_READ,
        PermissionsList.USERS_MANAGE,
        PermissionsList.USERS_PERMISSIONS_MANAGE,
        PermissionsList.USERS_AUDIT_READ,
      ],
      mechanic: [
        PermissionsList.ORDERS_READ,
        PermissionsList.ORDERS_STATUS_CHANGE,
        PermissionsList.ORDERS_MEDIA_ADD,
        PermissionsList.ORDERS_MEDIA_DELETE,
        PermissionsList.ORDERS_COMMENT_ADD,
      ],
      electrician: [
        PermissionsList.ORDERS_READ,
        PermissionsList.ORDERS_STATUS_CHANGE,
        PermissionsList.ORDERS_MEDIA_ADD,
        PermissionsList.ORDERS_MEDIA_DELETE,
        PermissionsList.ORDERS_COMMENT_ADD,
      ],
      user: [PermissionsList.SELF_OFFERS_READ, PermissionsList.SELF_ORDERS_READ],
      client: [PermissionsList.SELF_OFFERS_READ, PermissionsList.SELF_ORDERS_READ],
    };

    const permissions = profile?.permissions?.length
      ? profile.permissions
      : (roleDefaults[user.role] || []);

    if (permissions.includes('*')) {
      return true;
    }

    const hasAllRequired = requiredPermissions.every((perm) =>
      permissions.includes(perm),
    );

    if (!hasAllRequired) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}

