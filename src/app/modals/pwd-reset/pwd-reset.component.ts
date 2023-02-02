import {
  Component,
  OnInit,
  EventEmitter,
  Input,
  Output,
  AfterViewInit,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

// Project Dependencies
import { AuthService } from '_services';
@Component({
  selector: 'ang-pwd-reset-modal',
  templateUrl: 'pwd-reset.component.pug',
})
export class PwdResetModal implements OnInit, AfterViewInit {
  // Inputs that alter display behavior
  @Input() systemRequest: boolean;
  @Input() username: string;
  @Output() closeModal: EventEmitter<any> = new EventEmitter();

  @ViewChild('pwdResetContent', { read: ElementRef })
  pwdResetContent: ElementRef;
  @ViewChild('pwdResetEmailInput', { read: ElementRef })
  pwdResetEmailInput: ElementRef;
  @ViewChild('pwdResetSupportLink', { read: ElementRef })
  pwdResetSupportLink: ElementRef;
  @ViewChild('submitButton', { read: ElementRef }) submitButton: ElementRef;
  @ViewChild('cancelButton', { read: ElementRef }) cancelButton: ElementRef;
  @ViewChild('closeIcon', { read: ElementRef }) closeIcon: ElementRef;

  public pwdResetForm: FormGroup;

  public pwdReset = true;
  private pwdResetDisabled = false;
  private pwdRstEmail = '';
  public errorMsgPwdRst = '';
  public successMsgPwdRst = '';
  public rateLimitMsgPwdRst = '';
  public submitted = false;
  public copyKey = 'MODAL.PASSWORD.RESET';

  constructor(private _auth: AuthService, private _fb: FormBuilder) {}

  ngOnInit() {
    if (this.systemRequest) {
      this.copyKey = 'MODAL.PASSWORD.SYSTEM_REQUEST';
    }
    this.pwdResetForm = this._fb.group({
      email: [
        this.username,
        [
          Validators.required,
          Validators.pattern(
            /^(([^<>()[\]\\.,;:\s@\']+(\.[^<>()[\]\\.,;:\s@\']+)*)|(\'.+\'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
          ),
        ],
      ],
    });

    this._auth.pwdResetCheck().then(
      (data) => {
        console.log(data);
        if (!data.allowed) {
          this.pwdResetDisabled = true;
          this.copyKey = 'MODAL.PASSWORD.PREVENTED';
          this.rateLimitMsgPwdRst = this.copyKey + '.MESSAGE';
        }
        else {
          this.pwdResetDisabled = false;
        }
      },
      (error) => {}
    );
  }

  ngAfterViewInit() {
    // Focus first element
    this.pwdResetContent &&
      this.focusElement(this.pwdResetContent.nativeElement);

    // Set view child element refs
    this.submitButton = this.submitButton.nativeElement;
    this.cancelButton = this.cancelButton.nativeElement;
    this.closeIcon = this.closeIcon.nativeElement;
    this.pwdResetEmailInput = this.pwdResetEmailInput.nativeElement;
    this.pwdResetSupportLink = this.pwdResetSupportLink.nativeElement;
  }

  /**
   * Force focus upon a key event
   * @param event keydown/click event
   * @param element element to focus
   */
  public focusElement(element, event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    element.focus();
  }

  sendResetPwdRequest() {
    this.submitted = true;
    // avoid making the service calls, but still trigger error display
    if (!this.pwdResetForm.valid) {
      return;
    }
    this._auth.pwdReset(this.pwdResetForm.value.email).then(
      (data) => {
        if (data.success) {
          this.pwdReset = false;
          this.copyKey = 'MODAL.PASSWORD.SUCCESS';
          this.successMsgPwdRst = this.copyKey + '.MESSAGE';
        } else {
          this.errorMsgPwdRst = 'Sorry! An account for ' + this.pwdResetForm.value.email + ' was not found.';
          this.pwdResetForm.controls['email'].setValue('');
        }
      },
      (error) => {
        if (error.status == 429) {
          this.pwdReset = false;
          this.copyKey = 'MODAL.PASSWORD.PREVENTED';
          this.rateLimitMsgPwdRst = this.copyKey + '.MESSAGE';
        }
        this.errorMsgPwdRst = error.statusText;
      }
    );
  }
}
