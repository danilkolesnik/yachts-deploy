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
        host:"ep-twilight-sun-a2y5dnis.eu-central-1.pg.koyeb.app",
        port:5432,
        username:"koyeb-adm",
        password:"npg_HN76ryMJUTiK",
        database:"koyebdb",
        synchronize:true,
        entities: [__dirname + '/**/*.entity{.js, .ts}'],
        ssl: {
          rejectUnauthorized: false,
        },
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
