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
  private isArtstorUser: boolean = true;
  private tags: string[] = [];
  private igDescription: string = "Medium Editor is here but it has no styles!";

  private isLoading: boolean = false;

  constructor(_fb: FormBuilder) {
    this.newIgForm = _fb.group({
      title: [null, Validators.required],
      artstorPermissions: [this.isArtstorUser ? "private" : null],
      public: [null],
      tags: [this.tags]
    })
  }

  ngOnInit() { }

  private igFormSubmit(formValue: any): void {
    console.log(formValue);
    console.log(this.igDescription); // the description is not technically part of the form
  }
}