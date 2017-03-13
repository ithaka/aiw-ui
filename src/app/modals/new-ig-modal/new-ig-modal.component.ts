import { Router, ActivatedRoute } from '@angular/router';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { formGroupNameProvider } from '@angular/forms/src/directives/reactive_directives/form_group_name';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { Subscription } from 'rxjs/Rx';

// Project dependencies
import { AssetService, AuthService, GroupService } from './../../shared';

@Component({
  selector: 'ang-new-ig-modal',
  templateUrl: 'new-ig-modal.component.html'
})
export class NewIgModal implements OnInit {
  @Output() closeModal: EventEmitter<any> = new EventEmitter();
  @Output() addToGroup: EventEmitter<any> = new EventEmitter();

  @Input() private copyIG: boolean = false;
  @Input() private showAddToGroup: boolean = false;

  private newIgForm: FormGroup;
  private isArtstorUser: boolean = false;
  private tags: string[] = [];
  // We need to seed the medium editor with an empty div to fix line return issues in Firefox!
  private igDescription: string = "<div>&nbsp;</div>";
  @Input() private selectedAssets: any[] = [];

  private subscriptions: Subscription[] = [];
  private isLoading: boolean = false;
  private submitted: boolean = false;
  private serviceResponse: {
    success?: boolean,
    failure?: boolean
  } = {};
  private newGroup: any;

  constructor(
      private _assets: AssetService,
      private _auth: AuthService, 
      private _fb: FormBuilder, 
      private _group: GroupService,
      private router: Router,
      private route?: ActivatedRoute
  ) {
    this.newIgForm = _fb.group({
      title: [null, Validators.required],
      artstorPermissions: [this.isArtstorUser ? "private" : null],
      public: [null],
      tags: [this.tags]
    })
  }

  ngOnInit() {
    this.isArtstorUser = this._auth.getUser().institutionId == 1000;

    if (this.selectedAssets.length < 1) { // if an asset hasn't been injected, the component gets assets from list of selected assets
      // Subscribe to asset selection
      this.subscriptions.push(
        this._assets.selection.subscribe(
          assets => {
            this.selectedAssets = assets;
          },
          error => {
            console.log(error);
          }
        )
      );
    }
  }

  ngOnDestroy() {
      this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  private igFormSubmit(formValue: any): void {
    this.submitted = true;

    // avoid making the service calls, but still trigger error display
    if (!this.newIgForm.valid) {
      return;
    }
    this.isLoading = true;

    // Form is valid! Create Group object
    let itemIds = [];
    this.selectedAssets.forEach(
      item => {
        if (item.objectId) {
          itemIds.push(item.objectId);
        }
      }
    );

    let group = {
      name: formValue.title,
      description: this.igDescription == '<div>&nbsp;</div>' ? '' : this.igDescription,
      sequence_number: 0,
      access: [ {
        // This is the user's access object
        "entity_type": 100,
        "entity_identifier": this._auth.getUser().baseProfileId.toString(),
        "access_type": 300
      } ],
      items: itemIds,
      tags: formValue.tags
    };

    if(this.copyIG){
      console.log('Copy Image Group!');
      console.log(group);
      this._group.copy(this.route.snapshot.params['igId'], group)
      .subscribe(
        data => {
            console.log(data);
            this.isLoading = false;

            // Close the modal
            this.closeModal.emit();

            // Show the user their new group!
            if (data.id) {
              this.router.navigate(['/group', data.id]);
            }
        },
        error => {
          console.log(error);
          this.isLoading = false;
        }
      );
    }
    else{

      this._group.create(group)
        .subscribe(
          data => {
            console.log(data);
            this.isLoading = false;
            this.newGroup = data;
            this.serviceResponse.success = true;
          },
          error => {
            console.error(error);
            this.serviceResponse.failure = true;
            this.isLoading = false;
          }
        );
    }

    console.log(formValue);
    console.log(this.igDescription); // the description is not technically part of the form
  }
}