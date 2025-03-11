import { Test, TestingModule } from '@nestjs/testing';
import { PriceListController } from './price-list.controller';

describe('PriceListController', () => {
  let controller: PriceListController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PriceListController],
    }).compile();

    controller = module.get<PriceListController>(PriceListController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
