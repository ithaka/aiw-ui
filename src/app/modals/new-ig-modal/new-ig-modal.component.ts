import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { formGroupNameProvider } from '@angular/forms/src/directives/reactive_directives/form_group_name';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'ang-new-ig-modal',
  templateUrl: 'new-ig-modal.component.html'
})
export class NewIgModal implements OnInit {
  @Output() closeModal: EventEmitter<any> = new EventEmitter();

  private newIgForm: FormGroup;
  private isLoading: boolean = false;
  private tags: string[] = [];

  // private emptyArray: string[] = [];
  constructor(_fb: FormBuilder) {
    this.newIgForm = _fb.group({
      title: [null, Validators.required],
      public: [null],
      tags: [this.tags]
    })
  }

  ngOnInit() { }

  private igFormSubmit(formValue: any): void {
    console.log(formValue);
    // console.log(this.tags);
  }
}