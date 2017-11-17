// test imports
import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { By }              from '@angular/platform-browser';
import { DebugElement }    from '@angular/core';

// angular imports
import { Router } from '@angular/router';

// our file imports
import { ThumbnailComponent } from './thumbnail.component';
import { AssetService } from './../../shared/assets.service';
import { TypeIdPipe } from './../../shared';
import { Thumbnail } from './../../shared'

fdescribe('Thumbnail', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ThumbnailComponent, TypeIdPipe ], // declare the test component
      providers: [
        { provide: Router, useValue: {} },
        { provide: AssetService, useValue: {} }
      ]
    })
    .compileComponents();  // compile template and css
  }));

  describe("Thumbnail component", () => {
    let thumbnail: ThumbnailComponent;
    let fixture: ComponentFixture<ThumbnailComponent>;
    let de: DebugElement;
    let el: HTMLElement;

    beforeEach(() => {
      fixture = TestBed.createComponent(ThumbnailComponent);

      thumbnail = fixture.componentInstance;
    });

    it("should have alt text with value of asset title", () => {
      // initial test to verify that alt text exists
      let thumbnail = { arttitle: ['title'], thumbnail1: 'test-title' }
      de = fixture.debugElement.query(By.css('img'));
      el = de.nativeElement;
      el.setAttribute('alt', 'Thumbnail of ' + thumbnail.thumbnail1);
      expect(el.attributes['alt'].value).toBe('Thumbnail of test-title');
    });

    it("should have a tabindex", () => {
      // initial test to verify that tabindex exists
      de = fixture.debugElement.query(By.css('.card-block.card-text'));
      el = de.nativeElement;
      el.setAttribute('tabindex', '1');
      expect(el.attributes['tabindex'].value).toBe('1');
    });
  })
});
