// test imports
import { ComponentFixture, TestBed, async, inject } from '@angular/core/testing';
import { By }              from '@angular/platform-browser';
import { DebugElement }    from '@angular/core';

// angular imports
import { Router } from '@angular/router';

// our file imports
import { ThumbnailComponent } from './thumbnail.component';
import { AssetService } from './../../shared/assets.service';
import { TypeIdPipe } from './../../shared';
import { Thumbnail } from './../../shared'

class MockTestService {
  public makeThumbUrl(imagePath: string, size ?: number): string {
    return 'fakeURL';
  }
}

describe('Thumbnail', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ThumbnailComponent, TypeIdPipe ], // declare the test component
      providers: [
        { provide: Router, useValue: {} },
        { provide: AssetService, useValue: {}, useClass: MockTestService }
      ]
    })
    .compileComponents();  // compile template and css
  }));

  describe("Thumbnail component", () => {
    let comp: ThumbnailComponent;
    let fixture: ComponentFixture<ThumbnailComponent>;
    let de: DebugElement;
    let el: HTMLElement;

    beforeEach(() => {
      fixture = TestBed.createComponent(ThumbnailComponent);
      comp = fixture.componentInstance;
    });

    it("should have alt text with value of asset title", inject([AssetService], (_assets: AssetService) => {
      // initial test to verify that alt text exists
      (comp as any).thumbnail = { arttitle: ['title'], thumbnail1: 'test-title', thumbnailImgUrl: 'fake' }
      fixture.detectChanges();

      de = fixture.debugElement.query(By.css('img'));
      el = de.nativeElement;
      console.log(el);
      expect(el.attributes['alt'].value).toBe('Thumbnail of test-title');
    }));
  })
});
