import { AuthService } from '../../shared';
import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import { formGroupNameProvider } from '@angular/forms/src/directives/reactive_directives/form_group_name';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'ang-pwd-reset-modal',
  templateUrl: 'pwd-reset.component.pug'
})
export class PwdResetModal implements OnInit {
  // Inputs that alter display behavior
  @Input() systemRequest: boolean
  @Input() username: string
  @Output() closeModal: EventEmitter<any> = new EventEmitter()

  public pwdResetForm: FormGroup;

  public pwdReset = true;
  private pwdRstEmail = '';
  public errorMsgPwdRst = '';
  public successMsgPwdRst = '';
  public submitted = false;
  public copyKey = 'MODAL.PASSWORD.RESET'

  constructor(
    private _auth: AuthService,
    private _fb: FormBuilder
  ) {
    
  }

  ngOnInit() { 
    if (this.systemRequest) {
      this.copyKey = 'MODAL.PASSWORD.SYSTEM_REQUEST'
    }
    this.pwdResetForm = this._fb.group({
      'email': [this.username, [Validators.required, Validators.pattern(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)]]
    });
  }


  sendResetPwdRequest(){
    this.submitted = true;
    // avoid making the service calls, but still trigger error display
    if (!this.pwdResetForm.valid) {
      return;
    }
    this._auth.pwdReset(this.pwdResetForm.value.email)
      .then(
        (data)  => { this.loadPwdRstRes(data) },
        (error) => { this.errorMsgPwdRst = <any>error }
      );
  }
  
  loadPwdRstRes(res: any){
    if (!res.status || res.status === 'false'){
      this.errorMsgPwdRst = 'Sorry! An account for ' + this.pwdResetForm.value.email + ' was not found.'
      setTimeout(() => {
        this.errorMsgPwdRst = '';
        this.submitted = false
      }, 8000);
      this.pwdResetForm.controls['email'].setValue('');
    }
    else{
      this.pwdReset = false;
      this.copyKey = 'MODAL.PASSWORD.SUCCESS'
      this.successMsgPwdRst = this.copyKey + '.MESSAGE'
    }
  }
}
