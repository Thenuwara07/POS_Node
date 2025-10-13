// import { Test, TestingModule } from '@nestjs/testing';
// import { CashierController } from './cashier.controller';

// describe('CashierController', () => {
//   let controller: CashierController;

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       controllers: [CashierController],
//     }).compile();

//     controller = module.get<CashierController>(CashierController);
//   });

//   it('should be defined', () => {
//     expect(controller).toBeDefined();
//   });
// });

import { Test, TestingModule } from '@nestjs/testing';
import { CashierController } from './cashier.controller';
import { CashierService } from './cashier.service';

describe('CashierController', () => {
  let controller: CashierController;
  let service: CashierService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CashierController],
      providers: [
        {
          provide: CashierService,
          useValue: {
            getAllPayments: jest.fn().mockResolvedValue([{ id: 1, amount: 100 }]),
          },
        },
      ],
    }).compile();

    controller = module.get<CashierController>(CashierController);
    service = module.get<CashierService>(CashierService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return all payments', async () => {
    const result = await controller.getAllPayments();
    expect(result).toEqual([{ id: 1, amount: 100 }]);
  });
});
