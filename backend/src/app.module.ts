import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { WarehouseModule } from './warehouse/warehouse.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksModule } from './tasks/tasks.module';
import { OfferModule } from './offer/offer.module';
import { PriceListModule } from './price-list/price-list.module';
import { UsersModule } from './users/users.module';
import { OrderModule } from './order/order.module';
import { UploadModule } from './upload/upload.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import * as crypto from 'crypto';
import { users } from './auth/entities/users.entity';
import { File } from './upload/entities/file.entity';
import { offer } from './offer/entities/offer.entity';
import { order } from './order/entities/order.entity';
import { Pricelist } from './price-list/entities/pricelist.entity';
import { warehouse } from './warehouse/entities/warehouse.entity';
import { WarehouseHistory } from './warehouse/entities/warehouseHistory.entity';
import { OfferHistory } from './offer/entities/offer-history.entity';
import { OrderTimer } from './order/entities/order-timer.entity';
import { OrderStatusHistory } from './order/entities/order-status-history.entity';
import { OrderAssignmentHistory } from './order/entities/order-assignment-history.entity';
import * as fs from 'fs';
import * as path from 'path';
import { YachtModule } from './yacht/yacht.module';
import { Yacht } from './yacht/entities/yacht.entity';
import { EmployeeProfile } from './users/entities/employee-profile.entity';
import { UserPermissionHistory } from './users/entities/user-permission-history.entity';
import { UserAuditHistory } from './users/entities/user-audit-history.entity';
import { OrderClientMessage } from './order/entities/order-client-message.entity';

// Node 19+ already provides `globalThis.crypto` as a WebCrypto implementation.
// Only set it for older runtimes where it doesn't exist.
if (!(globalThis as any).crypto) {
  (globalThis as any).crypto = crypto;
}

const typeOrmEntities = [
  users,
  File,
  offer,
  order,
  Pricelist,
  warehouse,
  WarehouseHistory,
  OfferHistory,
  OrderTimer,
  OrderStatusHistory,
  OrderAssignmentHistory,
  OrderClientMessage,
  Yacht,
  EmployeeProfile,
  UserPermissionHistory,
  UserAuditHistory,
];

// Создаем необходимые директории при старте приложения
const createUploadDirectories = () => {
  const uploadDirs = ['uploads', 'uploads/video', 'uploads/image', 'uploads/logo'];
  uploadDirs.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
};

// Ensure upload directories exist at app startup
createUploadDirectories();

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({isGlobal:true}),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: {
        fallthrough: true
      }
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => {
        // Local dev fallback:
        // If Postgres envs are not provided, use a local sqlite DB file.
        const hasPostgresEnv =
          !!process.env.DATABASE_HOST &&
          !!process.env.DATABASE_USER &&
          !!process.env.DATABASE_PASSWORD &&
          !!process.env.DATABASE_NAME;

        if (!hasPostgresEnv) {
          return {
            type: 'sqlite',
            database: path.join(process.cwd(), 'local.sqlite'),
            synchronize: true,
            entities: typeOrmEntities,
          };
        }

        return {
          type: 'postgres',
          host: process.env.DATABASE_HOST,
          port: parseInt(process.env.DATABASE_PORT ?? '5432'),
          username: process.env.DATABASE_USER,
          password: process.env.DATABASE_PASSWORD,
          database: process.env.DATABASE_NAME,
          // Keep legacy behavior by default (true), but allow overriding.
          // For local work with imported dumps, set TYPEORM_SYNCHRONIZE=false.
          synchronize:
            process.env.TYPEORM_SYNCHRONIZE != null
              ? process.env.TYPEORM_SYNCHRONIZE === 'true'
              : true,
          entities: typeOrmEntities,
        };
      },
    }),
    AuthModule, 
    WarehouseModule, 
    TasksModule, 
    OfferModule, 
    PriceListModule, 
    UsersModule, 
    OrderModule, 
    UploadModule,
    YachtModule
  ],
  controllers: [AppController],
  providers: [AppService,],
})
export class AppModule {}
