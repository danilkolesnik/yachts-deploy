import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { users } from 'src/auth/entities/users.entity';
import { EmployeeProfile } from './entities/employee-profile.entity';
import { UserPermissionHistory } from './entities/user-permission-history.entity';
import { PermissionsList } from 'src/constants/permissions';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(users)
    private readonly usersRepository: Repository<users>,
    @InjectRepository(EmployeeProfile)
    private readonly employeeProfileRepository: Repository<EmployeeProfile>,
    @InjectRepository(UserPermissionHistory)
    private readonly userPermissionHistoryRepository: Repository<UserPermissionHistory>,
  ) {}

  private readonly ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
    admin: ['*'],
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
    manager: [
      PermissionsList.ORDERS_READ,
      PermissionsList.ORDERS_CREATE,
      PermissionsList.ORDERS_STATUS_CHANGE,
      PermissionsList.ORDERS_ASSIGNMENT_MANAGE,
      PermissionsList.ORDERS_MEDIA_ADD,
      PermissionsList.ORDERS_MEDIA_DELETE,
      PermissionsList.ORDERS_COMMENT_ADD,
    ],
    user: [
      PermissionsList.SELF_OFFERS_READ,
      PermissionsList.SELF_ORDERS_READ,
    ],
  };

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

  async findAllUsersExcludingRoles() {
    try {
      const usersExcludingRoles = await this.usersRepository.find({
        where: {
          role: Not(In(['user', 'admin'])),
        },
      });
      return {
        code: 200,
        data: usersExcludingRoles,
      };
    } catch (err) {
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }

  async findAllUsers() {
    try {
      const usersExcludingRoles = await this.usersRepository.find({
        where: {
          role: 'user',
        },
      });
      return {
        code: 200,
        data: usersExcludingRoles,
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

      const oldRole = user.role;
      user.role = newRole;
      const updatedUser = await this.usersRepository.save(user);

      // sync employee profile permissions and responsibility history if profile exists
      const profile = await this.employeeProfileRepository.findOne({
        where: { userId: id },
      });

      const defaultPermissions = this.ROLE_DEFAULT_PERMISSIONS[newRole] || [];
      let oldPermissions: string[] | undefined;
      if (profile) {
        oldPermissions = profile.permissions || [];
        profile.permissions = defaultPermissions;
        await this.employeeProfileRepository.save(profile);
      }

      const history = this.userPermissionHistoryRepository.create({
        userId: id,
        oldRole,
        newRole,
        oldPermissions,
        newPermissions: defaultPermissions,
      });
      await this.userPermissionHistoryRepository.save(history);

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

  async upsertEmployeeProfile(userId: string, data: Partial<EmployeeProfile>) {
    try {
      const user = await this.usersRepository.findOne({ where: { id: userId } });
      if (!user) {
        return { code: 404, message: 'User not found' };
      }

      let profile = await this.employeeProfileRepository.findOne({
        where: { userId },
      });

      const oldResponsibilityAreas = profile?.responsibilityAreas || [];
      const oldPermissions = profile?.permissions || [];

      if (!profile) {
        profile = this.employeeProfileRepository.create({
          userId,
          fullName: data.fullName || user.fullName,
          dateOfBirth: data.dateOfBirth,
          phone: data.phone || '',
          secondaryPhone: data.secondaryPhone || '',
          address: data.address || '',
          contractStart: data.contractStart,
          contractEnd: data.contractEnd,
          position: data.position || '',
          notes: data.notes,
          responsibilityAreas: data.responsibilityAreas || [],
          permissions:
            data.permissions ||
            this.ROLE_DEFAULT_PERMISSIONS[user.role] ||
            [],
        });
      } else {
        Object.assign(profile, {
          ...data,
          fullName: data.fullName ?? profile.fullName ?? user.fullName,
        });
        if (!profile.permissions || profile.permissions.length === 0) {
          profile.permissions =
            data.permissions ||
            this.ROLE_DEFAULT_PERMISSIONS[user.role] ||
            [];
        }
      }

      const saved = await this.employeeProfileRepository.save(profile);

      // log history if something changed
      const hasResponsibilityChange =
        JSON.stringify(oldResponsibilityAreas || []) !==
        JSON.stringify(saved.responsibilityAreas || []);
      const hasPermissionsChange =
        JSON.stringify(oldPermissions || []) !==
        JSON.stringify(saved.permissions || []);

      if (hasResponsibilityChange || hasPermissionsChange) {
        const history = this.userPermissionHistoryRepository.create({
          userId,
          oldResponsibilityAreas: oldResponsibilityAreas,
          newResponsibilityAreas: saved.responsibilityAreas || [],
          oldPermissions,
          newPermissions: saved.permissions || [],
        });
        await this.userPermissionHistoryRepository.save(history);
      }

      return { code: 200, data: saved };
    } catch (err) {
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }

  async getEmployeeProfile(userId: string) {
    try {
      const profile = await this.employeeProfileRepository.findOne({
        where: { userId },
      });
      if (!profile) {
        return { code: 404, message: 'Employee profile not found' };
      }
      return { code: 200, data: profile };
    } catch (err) {
      return {
        code: 500,
        message: err instanceof Error ? err.message : 'Internal server error',
      };
    }
  }
}