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
import { getEffectivePermissions, hasAllPermissions } from './effective-permissions';

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

    const permissions = getEffectivePermissions(user.role, profile?.permissions);

    if (permissions.includes('*')) {
      return true;
    }

    const hasAllRequired = hasAllPermissions(permissions, requiredPermissions);

    if (!hasAllRequired) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}

