import { TestBed } from '@angular/core/testing';

import { ArtstorStorageService } from './artstor-storage.service';

describe('ArtstorStorageService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ArtstorStorageService = TestBed.get(ArtstorStorageService);
    expect(service).toBeTruthy();
  });
});
