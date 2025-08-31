import { Test, TestingModule } from '@nestjs/testing';
import { InsightService } from './insight.service';

describe('InsightService', () => {
  let service: InsightService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InsightService],
    }).compile();

    service = module.get<InsightService>(InsightService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
