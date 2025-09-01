import { Test, TestingModule } from '@nestjs/testing';
import { CreditorsController } from './creditors.controller';

describe('CreditorsController', () => {
  let controller: CreditorsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreditorsController],
    }).compile();

    controller = module.get<CreditorsController>(CreditorsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
