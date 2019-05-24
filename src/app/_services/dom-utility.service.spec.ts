import { TestBed } from '@angular/core/testing';

import { DomUtilityService } from './dom-utility.service';

describe('DomUtilityService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DomUtilityService = TestBed.get(DomUtilityService);
    expect(service).toBeTruthy();
  });
});
