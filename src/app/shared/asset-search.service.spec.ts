/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { AssetSearchService } from './asset-search.service';

describe('Service: AssetSearch', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AssetSearchService]
    });
  });

  it('should ...', inject([AssetSearchService], (service: AssetSearchService) => {
    expect(service).toBeTruthy();
  }));
});