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
  @Output() igReloadTriggered: EventEmitter<any> = new EventEmitter();

  @Input() private copyIG: boolean = false;
  @Input() private editIG: boolean = false;
  @Input() private ig: any = false;
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
      public: [false],
      tags: [this.tags]
    })
  }

  ngOnInit() {
    this.isArtstorUser = this._auth.getUser().institutionId == 1000;
    if(this.ig.id && this.editIG){
      console.log(this.ig);
      (<FormControl>this.newIgForm.controls['title']).setValue(this.ig.name);

      this.tags = this.ig.tags;
      (<FormControl>this.newIgForm.controls['tags']).setValue(this.tags);

      (<FormControl>this.newIgForm.controls['public']).setValue(this.checkIfPublic());



      if(this.ig.description){
        let parentElement = document.createElement('div');
        parentElement.innerHTML = this.ig.description;

        if( parentElement.firstElementChild && (parentElement.firstElementChild.id === 'angularMediumEditor' )){
          this.igDescription = parentElement.firstElementChild.innerHTML;
        }
        else{
          this.igDescription =  parentElement.innerHTML;
        }
      }
    }

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

  private checkIfPublic(): boolean{
    let publicIG = false;
    for(let accessObj of this.ig.access){
      if(accessObj.entity_type === 200){
        publicIG = true;
        break;
      }
    }

    return publicIG;
  }

  private refreshIG(): void{
    this.igReloadTriggered.emit();
    this.closeModal.emit();
  }

  private igFormSubmit(formValue: any): void {
    this.submitted = true;
    // avoid making the service calls, but still trigger error display
    if (!this.newIgForm.valid) {
      return;
    }
    this.isLoading = true;

    let igDescValue = '';
    if(this.igDescription){
      let parentElement = document.createElement('div');
      parentElement.innerHTML = this.igDescription;

      if( parentElement.firstElementChild && (parentElement.firstElementChild.id === 'angularMediumEditor' )){
        igDescValue = parentElement.firstElementChild.innerHTML;
      }
      else{
        igDescValue =  parentElement.innerHTML;
      }
    }

    if (formValue.artstorPermissions == "institution" || formValue.artstorPermissions == "global") { formValue.public = true }

    // Form is valid! Create Group object
    let itemIds = [];
    this.selectedAssets.forEach(
      item => {
        if (item.objectId) {
          itemIds.push(item.objectId);
        }
        else if(item.id) {
          itemIds.push(item.id);
        }
      }
    );

    if(this.copyIG){
      
      let copyReqBody = {
        'name' : formValue.title
      };
      this._group.copy(this.route.snapshot.params['igId'], copyReqBody)

      .subscribe(
        data => {
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
    else if(this.editIG){
      let editGroup = {
        name: formValue.title,
        description: igDescValue == '<div>&nbsp;</div>' ? '' : igDescValue,
        sequence_number: 0,
        access: [ {
          // This is the user's access object
          "entity_type": 100,
          "entity_identifier": this._auth.getUser().baseProfileId.toString(),
          "access_type": 300
        } ],
        items: this.ig.items,
        tags: formValue.tags,
        id: this.ig.id
      };

      /**
       * Add institution access object if shared with Institution
       */
      if (formValue.public) {
        editGroup.access.push({
          entity_type: 200,
          entity_identifier: this._auth.getUser() && this._auth.getUser().institutionId.toString(),
          access_type: 100
        });
      }
      
      this._group.update(editGroup)
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
    else{

      let group = {
        name: formValue.title,
        description: igDescValue == '<div>&nbsp;</div>' ? '' : igDescValue,
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

      /**
       * Add institution access object if shared with Institution
       */
      if (formValue.public) {
        group.access.push({
          entity_type: 200,
          entity_identifier: this._auth.getUser() && this._auth.getUser().institutionId.toString(),
          access_type: 100
        });
      }

      this._group.create(group)
        .subscribe(
          data => {
            console.log(data);
            this.isLoading = false;
            this.newGroup = data;
            this.serviceResponse.success = true;

            // if an Artstor user set it so that "Everyone" can see it, call the server to make it global
            if (formValue.artstorPermissions == "global") {
              this._group.makeIgGlobal(this.newGroup.id)
                .take(1)
                .subscribe((res) => {
                  // not really sure what to do here?
                }, (err) => {
                  console.error(err)
                  // also not really sure what to do here...
                })
            }
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