import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { offer } from 'src/offer/entities/offer.entity';
import { order } from 'src/order/entities/order.entity';
import { users } from 'src/auth/entities/users.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, offer, order, users])],
  controllers: [InvoiceController],
  providers: [InvoiceService],
  exports: [InvoiceService],
})
export class InvoiceModule {}
