import { Router, ActivatedRoute } from '@angular/router';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { formGroupNameProvider } from '@angular/forms/src/directives/reactive_directives/form_group_name';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { Subscription } from 'rxjs/Rx';

// Project dependencies
import { AssetService, AuthService, GroupService, ImageGroup } from './../../shared';
import { AnalyticsService } from './../../analytics.service';
import { IgFormValue, IgFormUtil } from './new-ig';

@Component({
  selector: 'ang-new-ig-modal',
  templateUrl: 'new-ig-modal.component.html'
})
export class NewIgModal implements OnInit {
  @Output() closeModal: EventEmitter<any> = new EventEmitter();
  @Output() addToGroup: EventEmitter<any> = new EventEmitter();
  @Output() igReloadTriggered: EventEmitter<any> = new EventEmitter();

  /** Switch for running logic to copy image group */
  @Input() private copyIG: boolean = false;
  /** Switch for running loginc to edit image group */
  @Input() private editIG: boolean = false;
  /** The image group object */
  @Input() private ig: ImageGroup = <ImageGroup>{};
  /** Controls the user seeing the toggle to add images to group or create a new group */
  @Input() private showAddToGroup: boolean = false;

  /** The form */
  private newIgForm: FormGroup;
  /** Gives artstor institution users the ability to curate image public image groups */
  private isArtstorUser: boolean = false;
  // We need to seed the medium editor with an empty div to fix line return issues in Firefox!
  private igDescription: string = "<div>&nbsp;</div>";
  /** The list of assets which are currently selected from the asset grid */
  @Input() private selectedAssets: any[] = [];

  /** List of subscriptions to add to and then destroy ngOnDestroy */
  private subscriptions: Subscription[] = [];
  /** Controls display of loading symbol(s) */
  private isLoading: boolean = false;
  /** Set to true once the form is submitted */
  private submitted: boolean = false;
  /** Quick interface for controlling display of errors/response feedback */
  private serviceResponse: {
    success?: boolean,
    failure?: boolean
  } = {};
  /** The new group created after it comes back from the service */
  private newGroup: ImageGroup;

  private util: IgFormUtil = new IgFormUtil()

  constructor(
      private _assets: AssetService,
      private _auth: AuthService, 
      private _fb: FormBuilder, 
      private _group: GroupService,
      private _analytics: AnalyticsService,
      private router: Router,
      private route?: ActivatedRoute
  ) {
    this.newIgForm = _fb.group({
      title: [null, Validators.required],
      artstorPermissions: ["private", Validators.required],
      tags: [[]] // just initialize an empty array
    })
  }

  ngOnInit() {
    /** Set isArtstorUser to true if the user's institution is 1000. This will let them make global image groups */
    this.isArtstorUser = this._auth.getUser().institutionId == 1000;

    /** 
     * Set the field values, depending on the image group that is input
     *  only set the field values if you are copying or editing - otherwise, you're trying to make a new image group
     */
    if(this.ig.id && (this.copyIG || this.editIG)){
      this.setFormValues()
    }

    // if an asset hasn't been injected, the component gets assets from list of selected assets
    // otherwise, the injected image group's assets will be used
    if (this.selectedAssets.length < 1) {
      // Subscribe to asset selection
      this.subscriptions.push(
        this._assets.selection.subscribe(
          assets => {
            this.selectedAssets = assets;
          },
          error => {
            console.error(error);
          }
        )
      );
    }
  }

  ngOnDestroy() {
      this.subscriptions.forEach((sub) => { sub.unsubscribe() })
  }

  private refreshIG(): void{
    this.igReloadTriggered.emit()
    this.closeModal.emit()
  }

  /**
   * Called on form submission
   *  contains almost all of the logic for creating/editing the image group
   */
  private igFormSubmit(formValue: IgFormValue): void {
    this.submitted = true;
    // avoid making the service calls, but still trigger error display
    if (!this.newIgForm.valid) {
      return;
    }
    // Form is valid! Create Group object
    this.isLoading = true;

    /** extract the image group description and attach it to the igDescValue */
    let igDescValue = this.extractDescription()

    /**
     * Create the group object that will be submitted to the server 
     *  only funky thing here is that sometimes we get the list of asset ids from the image group, and sometimes from selected assets
     *  that depends on whether you're copying an image group or making a new one
     */
    let group = this.util.prepareGroup(formValue, igDescValue, this.copyIG || this.editIG ? this.ig.items : this.selectedAssets, this._auth.getUser())

    if(this.editIG){
      // Editing group
      this._analytics.directCall('edit_img_group')

      group.id = this.ig.id
      group.access = this.ig.access

      this._group.update(group)
        .subscribe(
          data => {
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
      // if an Artstor user, make sure the public property is set correctly
      if (this.isArtstorUser) {
        this.changeGlobalSetting(group, formValue.artstorPermissions == "global")
      }
      
    }
    else {
      // analytics events
      if(this.copyIG) {
        // Copying old group
        this._analytics.directCall('save_img_group_as')
      } else {
        // Create New Group
        this._analytics.directCall('save_selections_new_img_group')
      }

      // create the group using the group service
      this._group.create(group)
        .subscribe(
          data => {
            this.isLoading = false;
            this.newGroup = data;
            this.serviceResponse.success = true;

            // if an Artstor user, make sure the public property is set correctly
            if (this.isArtstorUser) {
              this.changeGlobalSetting(this.newGroup, formValue.artstorPermissions == "global")
            }
          },
          error => {
            console.error(error);
            this.serviceResponse.failure = true;
            this.isLoading = false;
          }
        );
    }
  }

  /**
   * A method to get the description string out of the field
   *  unfortunately, it seems like the only way to do that is with some direct dom references, for now
   * @returns the description string
   */
  private extractDescription(): string {
    let igDescValue = ''
    if(this.igDescription){
      let parentElement = document.createElement('div');
      parentElement.innerHTML = this.igDescription;

      if( parentElement.firstElementChild && (parentElement.firstElementChild.id === 'angularMediumEditor' )){
        igDescValue = parentElement.firstElementChild.innerHTML;
      }
      else{
        igDescValue = parentElement.innerHTML;
      }
    }

    return igDescValue == '<div>&nbsp;</div>' ? '' : igDescValue
  }

  /**
   * Sets the values of form members based on the injected image group
   */
  private setFormValues(): void {
    // set title value
    this.newIgForm.controls['title'].setValue(this.ig.name);

    // set tags values
    this.newIgForm.controls['tags'].setValue(this.ig.tags);

    if (this.ig.public) { this.newIgForm.controls['artstorPermissions'].setValue("global") }
    else if (this.institutionView()) { this.newIgForm.controls['artstorPermissions'].setValue("institution") }

    /** Setting the description based on the current image group's description requires some workarounds */
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

  /**
   * Checks if the user's institution has permission to view the image group
   * @returns true if the user's institution has permission to view the image group
   */
  private institutionView(): boolean {
    let institutionView = false
    for(let accessObj of this.ig.access) {
      if(accessObj.entity_type === 200) {
        institutionView = true
        break
      }
    }

    return institutionView
  }

  /**
   * Updates a group's public property. Should only be called for artstor users.
   * @param group the image group which needs the public property changed
   * @param isPublic the value to set the public property to
   */
  private changeGlobalSetting(group: ImageGroup, isPublic: boolean): void {
    this._group.updateIgPublic(group.id, isPublic)
      .take(1)
      .subscribe((res) => {
        // not really sure what to do here?
        console.log(res)
      }, (err) => {
        console.error(err)
        // also not really sure what to do here...
      })
  }
}