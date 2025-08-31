import { Test, TestingModule } from '@nestjs/testing';
import { InsightController } from './insight.controller';

describe('InsightController', () => {
  let controller: InsightController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InsightController],
    }).compile();

    controller = module.get<InsightController>(InsightController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
