import { Component, OnInit, EventEmitter, Input, Output, AfterViewInit, ElementRef, ViewChild } from '@angular/core'
import { FormGroup, FormBuilder, Validators } from '@angular/forms'

// Project Dependencies
import { AuthService } from '../../shared'
@Component({
  selector: 'ang-pwd-reset-modal',
  templateUrl: 'pwd-reset.component.pug'
})
export class PwdResetModal implements OnInit, AfterViewInit {
  // Inputs that alter display behavior
  @Input() systemRequest: boolean
  @Input() username: string
  @Output() closeModal: EventEmitter<any> = new EventEmitter()

  @ViewChild("pwdResetTitle", {read: ElementRef}) titleElement: ElementRef
  @ViewChild("submitButton", { read: ElementRef}) submitButton: ElementRef
  @ViewChild("cancelButton", { read: ElementRef}) cancelButton: ElementRef

  public pwdResetForm: FormGroup;

  public pwdReset = true
  private pwdRstEmail = ''
  public errorMsgPwdRst = ''
  public successMsgPwdRst = ''
  public submitted = false
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

  ngAfterViewInit() {
    // Focus first element
    this.titleElement && this.focusElement(this.titleElement.nativeElement)

    // Set view child element refs
    this.submitButton = this.submitButton.nativeElement
    this.cancelButton = this.cancelButton.nativeElement
  }

  /**
   * Force focus upon a key event
   * @param event keydown/click event
   * @param element element to focus
   */
  public focusElement(element: HTMLElement, event?: Event) {
    if (event) {
      event.stopPropagation()
      event.preventDefault()
    }
    element.focus()
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
      this.pwdResetForm.controls['email'].setValue('');
    }
    else{
      this.pwdReset = false;
      this.copyKey = 'MODAL.PASSWORD.SUCCESS'
      this.successMsgPwdRst = this.copyKey + '.MESSAGE'
    }
  }
}
