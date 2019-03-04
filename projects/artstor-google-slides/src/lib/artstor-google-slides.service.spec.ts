import { TestBed } from '@angular/core/testing';

import { ArtstorGoogleSlidesService } from './artstor-google-slides.service';

describe('ArtstorGoogleSlidesService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ArtstorGoogleSlidesService = TestBed.get(ArtstorGoogleSlidesService);
    expect(service).toBeTruthy();
  });
});
