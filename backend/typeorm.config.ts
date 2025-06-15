import { DataSource } from 'typeorm';
import { users } from './src/auth/entities/users.entity';
import { File } from './src/upload/entities/file.entity';
import { offer } from './src/offer/entities/offer.entity';
import { order } from './src/order/entities/order.entity';
import { Pricelist } from './src/price-list/entities/pricelist.entity';
import { warehouse } from './src/warehouse/entities/warehouse.entity';
import { WarehouseHistory } from './src/warehouse/entities/warehouseHistory.entity';
import { OfferHistory } from './src/offer/entities/offer-history.entity';
import { OrderTimer } from './src/order/entities/order-timer.entity';
import { Yacht } from './src/yacht/entities/yacht.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT ?? '5432'),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [
    users,
    File,
    offer,
    order,
    Pricelist,
    warehouse,
    WarehouseHistory,
    OfferHistory,
    OrderTimer,
    Yacht
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
}); 