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
(global as any).crypto = crypto;

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
        }),

      ],
      useFactory:() =>({
        type:"postgres",
        host:process.env.DATABASE_HOST,
        port: parseInt(process.env.DATABASE_PORT ?? '5432'),
        username:process.env.DATABASE_USER,
        password:process.env.DATABASE_PASSWORD,
        database:process.env.DATABASE_NAME,
        synchronize: false,
        entities: [__dirname + '/**/*.entity{.js, .ts}'],
        ssl: {
          rejectUnauthorized: false,
        },
        // type:"postgres",
        // host:"localhost",
        // port:5432,
        // username:"postgres",
        // password:"12345678",
        // database:"yachts",
        // synchronize:true,
        // entities: [__dirname + '/**/*.entity{.js, .ts}']
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
