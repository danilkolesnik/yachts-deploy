import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { users } from './entities/users.entity';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import generateRandomId from 'src/methods/generateRandomId';
import getBearerToken from 'src/methods/getBearerToken';

import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { JwtPayload } from 'jsonwebtoken';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(users)
        private readonly usersModule: Repository<users>,
    ){}

    async create(data: CreateAuthDto) {
        if (!data.email || !data.password) {
          return {
            code: 400,
            message: 'Not all arguments',
          };
        }

        try {
          const checkUser = await this.usersModule.findOne({
            where: { email: data.email },
          });
          if (checkUser) {
            return {
              code: 409,
              message: 'This user already exists',
            };
          }
    
          const generateId = generateRandomId();
    
          const result = await this.usersModule.save(
            this.usersModule.create({
              id: generateId,
              email: data.email,
              fullName: data.fullName,
              password: bcrypt.hashSync(data.password),
            }),
          );

          return {
            code: 201,
            data: result,
          };
        } catch (err) {
          return {
            code: 500,
            message: err,
          };
        }
    }

    async createClient(data: CreateAuthDto) {
      if (!data.email || !data.fullName) {
        return {
          code: 400,
          message: 'Not all arguments',
        };
      }

      const genaratePassword = generateRandomId();

      try {
        const checkUser = await this.usersModule.findOne({
          where: { email: data.email },
        });

        if (checkUser) {
          return {
            code: 409,
            message: 'This user already exists',
          };
        }

        const generateId = generateRandomId();

        const result = await this.usersModule.save(
          this.usersModule.create({
            id: generateId,
            email: data.email,
            fullName: data.fullName,
            password: bcrypt.hashSync(genaratePassword),
          }),
        );

        return {
          code: 201,
          data: result,
        };
      } catch (err) {
        return {
          code: 500,
          message: err,
        };
      }
    }

    async loginClient(data: LoginAuthDto) {
      if (!data.email || !data.password) {
        return {
          code: 400,
          message: 'Not all arguments',
        };
      }
  
      try {
        const checkUser = await this.usersModule.findOne({
          where: {
            email: data.email,
          },
        });
  
        if (!checkUser) {
          return {
            code: 404,
            message: 'Not Found',
          };
        }
  
        if (bcrypt.compareSync(data.password, checkUser.password)) {
          const token = jwt.sign(
            { id: checkUser.id, role: checkUser.role },
            process.env.SECRET_KEY as string
          );

          return {
            code: 200,
            token: token,
          };
        } else {
          return {
            code: 400,
            message: 'Password is not correct',
          };
        }
      } catch (err) {
        console.log(err);
        return {
          code: 500,
          message: err,
        };
      }
    }

    async verify(req: Request) {
      const token = getBearerToken(req);
      try {
        if (!token) {
          return {
            code: 400,
            message: 'Not all arguments',
          };
        }
        const login = jwt.verify(token, process.env.SECRET_KEY) as JwtPayload;

        if (!login || typeof login !== 'object' || !('id' in login)) {
          return {
            code: 400,
            message: 'Invalid token',
          };
        }

        const checkUser = await this.usersModule.findOne({
          where: {
            id: login.id,
          },
        });
  
        if (checkUser) {
          return {
            code: 200,
            data: checkUser,
          };
        }
  
        return {
          code: 404,
          message: 'Not Found',
        };
      } catch (err) {
        return {
          code: 500,
          message: err,
        };
      }
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string) {
      try {
        const user = await this.usersModule.findOne({ where: { id: userId } });

        if (!user) {
          return {
            code: 404,
            message: 'User not found',
          };
        }

        // Verify current password
        const isMatch = bcrypt.compareSync(currentPassword, user.password);
        if (!isMatch) {
          return {
            code: 400,
            message: 'Current password is incorrect',
          };
        }

        // Hash the new password
        const hashedPassword = bcrypt.hashSync(newPassword, 10);

        // Update the user's password
        user.password = hashedPassword;
        await this.usersModule.save(user);

        return {
          code: 200,
          message: 'Password updated successfully',
        };
      } catch (err) {
        return {
          code: 500,
          message: err instanceof Error ? err.message : 'Internal server error',
        };
      }
    }
}
