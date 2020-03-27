import { TestBed } from '@angular/core/testing';

import { CacheRouteReuseStrategyService } from './cache-route-reuse-strategy.service';

describe('CacheRouteReuseStrategyService', () => {
  let service: CacheRouteReuseStrategyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CacheRouteReuseStrategyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
