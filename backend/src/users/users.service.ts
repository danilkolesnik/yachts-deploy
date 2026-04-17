import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { users } from 'src/auth/entities/users.entity';
import { EmployeeProfile } from './entities/employee-profile.entity';
import { UserPermissionHistory } from './entities/user-permission-history.entity';
import { PermissionsList } from 'src/constants/permissions';
import { UserAuditHistory } from './entities/user-audit-history.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(users)
    private readonly usersRepository: Repository<users>,
    @InjectRepository(EmployeeProfile)
    private readonly employeeProfileRepository: Repository<EmployeeProfile>,
    @InjectRepository(UserPermissionHistory)
    private readonly userPermissionHistoryRepository: Repository<UserPermissionHistory>,
    @InjectRepository(UserAuditHistory)
    private readonly userAuditHistoryRepository: Repository<UserAuditHistory>,
  ) {}

  private async audit(
    userId: string,
    entityType: string,
    changeDescription: unknown,
    changedBy?: string,
  ) {
    try {
      await this.userAuditHistoryRepository.save(
        this.userAuditHistoryRepository.create({
          userId,
          entityType,
          changedBy,
          changeDescription:
            typeof changeDescription === 'string'
              ? changeDescription
              : JSON.stringify(changeDescription),
        }),
      );
    } catch {
      // auditing must not break main flow
    }
  }

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
      PermissionsList.USERS_READ,
      PermissionsList.USERS_MANAGE,
      PermissionsList.USERS_PERMISSIONS_MANAGE,
      PermissionsList.USERS_AUDIT_READ,
    ],
    user: [
      PermissionsList.SELF_OFFERS_READ,
      PermissionsList.SELF_ORDERS_READ,
    ],
    client: [
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
          role: Not(In(['user', 'client', 'admin'])),
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
          role: In(['user', 'client']),
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

  async updateUserRole(id: string, newRole: string, changedBy?: string) {
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
        changedBy,
        oldRole,
        newRole,
        oldPermissions,
        newPermissions: defaultPermissions,
      });
      await this.userPermissionHistoryRepository.save(history);
      await this.audit(id, 'user', { oldRole, newRole }, changedBy);

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

  async upsertEmployeeProfile(userId: string, data: Partial<EmployeeProfile>, changedBy?: string) {
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
      await this.audit(
        userId,
        'employee_profile',
        { before: profile ? { ...profile } : null, after: saved },
        changedBy,
      );

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
          changedBy,
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

  async updateUser(id: string, data: Partial<users>, changedBy?: string) {
    try {
      const user = await this.usersRepository.findOne({ where: { id } });
      if (!user) return { code: 404, message: 'User not found' };

      const before = { email: user.email, fullName: user.fullName };
      if (typeof data.email === 'string') user.email = data.email;
      if (typeof data.fullName === 'string') user.fullName = data.fullName;

      const saved = await this.usersRepository.save(user);
      await this.audit(id, 'user', { before, after: { email: saved.email, fullName: saved.fullName } }, changedBy);
      return { code: 200, data: saved };
    } catch (err) {
      return { code: 500, message: err instanceof Error ? err.message : 'Internal server error' };
    }
  }

  async deleteUser(id: string, changedBy?: string) {
    try {
      const user = await this.usersRepository.findOne({ where: { id } });
      if (!user) return { code: 404, message: 'User not found' };
      await this.usersRepository.delete(id);
      await this.audit(id, 'user', { deleted: true }, changedBy);
      return { code: 200, message: 'User deleted successfully' };
    } catch (err) {
      return { code: 500, message: err instanceof Error ? err.message : 'Internal server error' };
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

  async getUserHistory(
    userId: string,
    opts: {
      from?: string;
      to?: string;
      actorName?: string;
      actorRole?: string;
      type?: string;
      req?: any;
    },
  ) {
    try {
      const fromDate = opts.from ? new Date(opts.from) : undefined;
      const toDate = opts.to ? new Date(opts.to) : undefined;
      const type = (opts.type || '').trim().toLowerCase();

      const auditQ = this.userAuditHistoryRepository
        .createQueryBuilder('a')
        .where('a.userId = :userId', { userId });

      if (fromDate && !Number.isNaN(fromDate.getTime())) {
        auditQ.andWhere('a.createdAt >= :from', { from: fromDate.toISOString() });
      }
      if (toDate && !Number.isNaN(toDate.getTime())) {
        auditQ.andWhere('a.createdAt <= :to', { to: toDate.toISOString() });
      }
      if (type) {
        auditQ.andWhere('LOWER(a.entityType) LIKE :type', { type: `%${type}%` });
      }

      const permQ = this.userPermissionHistoryRepository
        .createQueryBuilder('p')
        .where('p.userId = :userId', { userId });

      if (fromDate && !Number.isNaN(fromDate.getTime())) {
        permQ.andWhere('p.changedAt >= :from', { from: fromDate.toISOString() });
      }
      if (toDate && !Number.isNaN(toDate.getTime())) {
        permQ.andWhere('p.changedAt <= :to', { to: toDate.toISOString() });
      }

      const [audits, perms] = await Promise.all([auditQ.getMany(), permQ.getMany()]);

      const actorIds = Array.from(
        new Set(
          [...audits.map((a) => a.changedBy).filter(Boolean), ...perms.map((p) => p.changedBy).filter(Boolean)].map(
            (x) => String(x),
          ),
        ),
      );

      const actors = actorIds.length
        ? await this.usersRepository.find({ where: { id: In(actorIds) } })
        : [];
      const actorById = new Map(actors.map((u) => [String(u.id), u]));

      let events: any[] = [
        ...audits.map((a) => ({
          id: a.id,
          at: a.createdAt,
          type: a.entityType || 'audit',
          targetUserId: a.userId,
          actorUserId: a.changedBy || null,
          actor: a.changedBy ? actorById.get(String(a.changedBy)) || null : null,
          payload: a.changeDescription,
        })),
        ...perms.map((p) => ({
          id: p.id,
          at: p.changedAt,
          type: 'permissions',
          targetUserId: p.userId,
          actorUserId: p.changedBy || null,
          actor: p.changedBy ? actorById.get(String(p.changedBy)) || null : null,
          payload: {
            oldRole: p.oldRole,
            newRole: p.newRole,
            oldPermissions: p.oldPermissions || [],
            newPermissions: p.newPermissions || [],
            oldResponsibilityAreas: p.oldResponsibilityAreas || [],
            newResponsibilityAreas: p.newResponsibilityAreas || [],
          },
        })),
      ];

      // optional actor filters (name/role)
      const actorName = (opts.actorName || '').trim().toLowerCase();
      const actorRole = (opts.actorRole || '').trim().toLowerCase();
      if (actorName || actorRole) {
        events = events.filter((e) => {
          const a = e.actor;
          if (!a) return false;
          if (actorRole && String(a.role || '').toLowerCase() !== actorRole) return false;
          if (actorName) {
            const hay = `${a.fullName || ''} ${a.email || ''}`.toLowerCase();
            if (!hay.includes(actorName)) return false;
          }
          return true;
        });
      }

      events.sort((x, y) => new Date(x.at).getTime() - new Date(y.at).getTime());

      return { code: 200, data: events };
    } catch (err) {
      return { code: 500, message: err instanceof Error ? err.message : 'Internal server error' };
    }
  }

  async getAllUsersHistory(opts: {
    from?: string;
    to?: string;
    targetUserId?: string;
    actorName?: string;
    actorRole?: string;
    type?: string;
  }) {
    try {
      const fromDate = opts.from ? new Date(opts.from) : undefined;
      const toDate = opts.to ? new Date(opts.to) : undefined;
      const type = (opts.type || '').trim().toLowerCase();
      const targetUserId = (opts.targetUserId || '').trim();

      const auditQ = this.userAuditHistoryRepository.createQueryBuilder('a');
      if (targetUserId) {
        auditQ.where('a.userId = :userId', { userId: targetUserId });
      }
      if (fromDate && !Number.isNaN(fromDate.getTime())) {
        auditQ.andWhere('a.createdAt >= :from', { from: fromDate.toISOString() });
      }
      if (toDate && !Number.isNaN(toDate.getTime())) {
        auditQ.andWhere('a.createdAt <= :to', { to: toDate.toISOString() });
      }
      if (type) {
        auditQ.andWhere('LOWER(a.entityType) LIKE :type', { type: `%${type}%` });
      }

      const permQ = this.userPermissionHistoryRepository.createQueryBuilder('p');
      if (targetUserId) {
        permQ.where('p.userId = :userId', { userId: targetUserId });
      }
      if (fromDate && !Number.isNaN(fromDate.getTime())) {
        permQ.andWhere('p.changedAt >= :from', { from: fromDate.toISOString() });
      }
      if (toDate && !Number.isNaN(toDate.getTime())) {
        permQ.andWhere('p.changedAt <= :to', { to: toDate.toISOString() });
      }

      const [audits, perms] = await Promise.all([auditQ.getMany(), permQ.getMany()]);

      const actorIds = Array.from(
        new Set(
          [...audits.map((a) => a.changedBy).filter(Boolean), ...perms.map((p) => p.changedBy).filter(Boolean)].map(
            (x) => String(x),
          ),
        ),
      );

      const targetIds = Array.from(new Set([...audits.map((a) => a.userId), ...perms.map((p) => p.userId)].map(String)));

      const [actors, targets] = await Promise.all([
        actorIds.length ? this.usersRepository.find({ where: { id: In(actorIds) } }) : [],
        targetIds.length ? this.usersRepository.find({ where: { id: In(targetIds) } }) : [],
      ]);

      const actorById = new Map(actors.map((u) => [String(u.id), u] as const));
      const targetById = new Map(targets.map((u) => [String(u.id), u] as const));

      let events: any[] = [
        ...audits.map((a) => ({
          id: a.id,
          at: a.createdAt,
          type: a.entityType || 'audit',
          targetUserId: a.userId,
          targetUser: targetById.get(String(a.userId)) || null,
          actorUserId: a.changedBy || null,
          actor: a.changedBy ? actorById.get(String(a.changedBy)) || null : null,
          payload: a.changeDescription,
        })),
        ...perms.map((p) => ({
          id: p.id,
          at: p.changedAt,
          type: 'permissions',
          targetUserId: p.userId,
          targetUser: targetById.get(String(p.userId)) || null,
          actorUserId: p.changedBy || null,
          actor: p.changedBy ? actorById.get(String(p.changedBy)) || null : null,
          payload: {
            oldRole: p.oldRole,
            newRole: p.newRole,
            oldPermissions: p.oldPermissions || [],
            newPermissions: p.newPermissions || [],
            oldResponsibilityAreas: p.oldResponsibilityAreas || [],
            newResponsibilityAreas: p.newResponsibilityAreas || [],
          },
        })),
      ];

      const actorName = (opts.actorName || '').trim().toLowerCase();
      const actorRole = (opts.actorRole || '').trim().toLowerCase();
      if (actorName || actorRole) {
        events = events.filter((e) => {
          const a = e.actor;
          if (!a) return false;
          if (actorRole && String(a.role || '').toLowerCase() !== actorRole) return false;
          if (actorName) {
            const hay = `${a.fullName || ''} ${a.email || ''}`.toLowerCase();
            if (!hay.includes(actorName)) return false;
          }
          return true;
        });
      }

      // newest first for global history view
      events.sort((x, y) => new Date(y.at).getTime() - new Date(x.at).getTime());

      return { code: 200, data: events };
    } catch (err) {
      return { code: 500, message: err instanceof Error ? err.message : 'Internal server error' };
    }
  }
}