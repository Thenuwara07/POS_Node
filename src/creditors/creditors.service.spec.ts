import { Test, TestingModule } from '@nestjs/testing';
import { CreditorsService } from './creditors.service';

describe('CreditorsService', () => {
  let service: CreditorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreditorsService],
    }).compile();

    service = module.get<CreditorsService>(CreditorsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
