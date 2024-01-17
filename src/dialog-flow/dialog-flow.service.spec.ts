import { Test, TestingModule } from '@nestjs/testing';
import { DialogFlowService } from './dialog-flow.service';

describe('DialogFlowService', () => {
  let service: DialogFlowService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DialogFlowService],
    }).compile();

    service = module.get<DialogFlowService>(DialogFlowService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
