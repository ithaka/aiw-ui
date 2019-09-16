import { AfterViewInit, Directive, ElementRef } from '@angular/core';
import { FocusTrapFactory } from '@angular/cdk/a11y';

@Directive({
  selector: '[focusTrap]'
})
export class FocusTrapDirective implements AfterViewInit {

  constructor(private focusTrapFactory: FocusTrapFactory, private el: ElementRef) {}

  ngAfterViewInit() {
    const focusTrap = this.focusTrapFactory.create(this.el.nativeElement);
    focusTrap.focusInitialElement();
  }

}
