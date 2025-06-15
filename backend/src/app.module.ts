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
import * as fs from 'fs';
import * as path from 'path';

(global as any).crypto = crypto;

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

createUploadDirectories();

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({isGlobal:true}),
    TypeOrmModule.forRootAsync({
      imports:[
        ConfigModule,
        ServeStaticModule.forRoot({
          rootPath: join(__dirname, '..', 'uploads'),
          serveRoot: '/uploads',
          serveStaticOptions: {
            fallthrough: true
          }
        }),
      ],
      useFactory:() =>({
        type:"postgres",
        host:process.env.DATABASE_HOST,
        port: parseInt(process.env.DATABASE_PORT ?? '5432'),
        username:process.env.DATABASE_USER,
        password:process.env.DATABASE_PASSWORD,
        database:process.env.DATABASE_NAME,
        synchronize: true,
        entities: [
          users,
          File,
          offer,
          order,
          Pricelist,
          warehouse,
          WarehouseHistory,
          OfferHistory,
          OrderTimer
        ],
      })
    }),
    AuthModule, 
    WarehouseModule, 
    TasksModule, 
    OfferModule, 
    PriceListModule, 
    UsersModule, 
    OrderModule, 
    UploadModule
  ],
  controllers: [AppController],
  providers: [AppService,],
})
export class AppModule {}
