import { Component, EventEmitter, HostListener, Input, OnInit, Output, ElementRef, Inject, PLATFORM_ID, ViewChild } from '@angular/core'
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms'
import { Subscription } from 'rxjs'
import { map, take } from 'rxjs/operators'
import { Angulartics2 } from 'angulartics2'

// Project dependencies
import { AssetService, AuthService, GroupService, ImageGroup, LogService } from './../../shared'
import { ToastService } from 'app/_services';
import { IgFormValue, IgFormUtil } from './new-ig'
import { isPlatformBrowser } from '@angular/common'
import { Router } from '@angular/router'
import { ArtstorStorageService } from '../../../../projects/artstor-storage/src/public_api';

@Component({
  selector: 'ang-new-ig-modal',
  templateUrl: 'new-ig-modal.component.pug'
})
export class NewIgModal implements OnInit {
  @Output() closeModal: EventEmitter<any> = new EventEmitter();
  @Output() addToGroup: EventEmitter<any> = new EventEmitter();
  @Output() igReloadTriggered: EventEmitter<any> = new EventEmitter();
  /** Switch for running loginc to edit image group */
  @Input() public editIG: boolean = false;
  /** Quick interface for controlling display of errors/response feedback */
  public serviceResponse: {
    success?: boolean,
    failure?: boolean
  } = {};
  public errorMsg: string = ''

  public hasPrivateGroups: boolean = false // If a user has at least one image group

  /** Switch for running logic to copy image group */
  @Input() private copyIG: boolean = false;
  /** The image group object */
  @Input() private ig: ImageGroup = <ImageGroup>{};
  /** Controls the user seeing the toggle to add images to group or create a new group */
  @Input() private showAddToGroup: boolean = true

  @ViewChild("modal", {read: ElementRef}) modalElement: ElementRef;

  /** The form */
  private newIgForm: FormGroup;
  /** Gives artstor institution users the ability to curate image public image groups */
  private isArtstorUser: boolean = false;
  // We need to seed the medium editor with an empty div to fix line return issues in Firefox!
  private igDescription: string = '';
  /** The list of assets which are currently selected from the asset grid */
  @Input() private selectedAssets: any[] = [];

  /** List of subscriptions to add to and then destroy ngOnDestroy */
  private subscriptions: Subscription[] = [];
  /** Controls display of loading symbol(s) */
  private isLoading: boolean = false;
  /** Set to true once the form is submitted */
  private submitted: boolean = false;
  /** The new group created after it comes back from the service */
  private newGroup: ImageGroup;

  private util: IgFormUtil = new IgFormUtil()

  private tagSuggestions: string[] = []

  // There must be a more Angular way to handle this debounce
  private tagSuggestTerm: string = ''
  private tagLastSearched: string = ''
  private tagDebouncing: boolean = false

  private groupUrl
  private options: any = {}

  constructor(
      private _assets: AssetService,
      private _auth: AuthService,
      private _fb: FormBuilder,
      private _group: GroupService,
      private _log: LogService,
      private _angulartics: Angulartics2,
      private el: ElementRef,
      private router: Router,
      private _storage: ArtstorStorageService,
      private _toasts: ToastService

  ) {
    this.newIgForm = _fb.group({
      title: [null, Validators.required],
      artstorPermissions: ['private', Validators.required],
      tags: [[]] // just initialize an empty array
    })
  }

  ngOnInit() {
    // Does user have any private groups yet?
    // Check local storage first, otherwise call group service
    let hasPrivate = this._storage.getLocal('hasPrivateGroups')
    if (hasPrivate)  {
      this.hasPrivateGroups = true
    }
    else {
      this._group.hasPrivateGroups().pipe(
        take(1),
        map(res => {
          if (res['total'] > 0) {
            this.hasPrivateGroups = true
            this._storage.setLocal('hasPrivateGroups', true)
          }
        },
          (err) => {
            console.error(err)
          }
        )).subscribe()
    }

    // Set focus to the modal to make the links in the modal first thing to tab for accessibility
    // let htmlelement: HTMLElement = this.el.nativeElement
    // htmlelement.focus()
    if (this.modalElement && this.modalElement.nativeElement){
      this.modalElement.nativeElement.focus()
    }

    /** Set isArtstorUser to true if the user's institution is 1000. This will let them make global image groups */
    this.isArtstorUser = this._auth.getUser().institutionId == 1000;

    /**
     * Set the field values, depending on the image group that is input
     *  only set the field values if you are copying or editing - otherwise, you're trying to make a new image group
     */
    if (this.ig.id && (this.copyIG || this.editIG)){
      this.setFormValues()
    }

    // if an asset hasn't been injected, the component gets assets from list of selected assets
    // otherwise, the injected image group's assets will be used
    if (this.selectedAssets.length < 1) {
      // Subscribe to asset selection
      this.subscriptions.push(
        this._assets.selection.pipe(
        map(assets => {
          this.selectedAssets = assets
        },
        error => {
          console.error(error)
        }
        )).subscribe()
      )
    }
  }

  ngOnDestroy() {
      this.subscriptions.forEach((sub) => { sub.unsubscribe() })
  }

  private refreshIG(): void{
    this.igReloadTriggered.emit()
    this.closeModal.emit()
  }

  private getTagSuggestions(event: any): void  {
    this.tagSuggestTerm = event.target.value

    if (!this.tagDebouncing) {
      this.tagDebouncing = true

      setTimeout(() => {
        this.tagDebouncing = false

        if (this.tagLastSearched != this.tagSuggestTerm) {
          this.tagLastSearched = this.tagSuggestTerm

          this._group.getTagSuggestions(this.tagSuggestTerm).pipe(
            take(1),
            map(data => {
              if (data['success']) {
                this.tagSuggestions = data['tags']
                // Trigger tag input to re-assess autocomplete array
                // event.srcElement.dispatch(new Event('change'))
              }
            },
            err => {
              console.error(err)
            }
          )).subscribe()
        }
      }, 700)
    }

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
    let igDescValue = this.igDescription

    /**
     * Create the group object that will be submitted to the server
     *  only funky thing here is that sometimes we get the list of asset ids from the image group, and sometimes from selected assets
     *  that depends on whether you're copying an image group or making a new one
     */
    let group = this.util.prepareGroup(
      formValue, igDescValue, this.copyIG || this.editIG ? this.ig.items : this.selectedAssets,
      this._auth.getUser(),
      this.ig
    )
    let multipleSelected: boolean = this.selectedAssets.length > 1

    if (this.editIG) {
      group.id = this.ig.id // need this for the update call
      // Editing group
      this._angulartics.eventTrack.next({ properties: { event: 'editGroup', category: 'groups', label: group.id }});

      this._group.update(group).pipe(
        map(data => {
            this.isLoading = false;
            this.newGroup = data;
            // this.serviceResponse.success = true;
            this._assets.clearSelectMode.next(true);

            this.closeModal.emit()
            this.igReloadTriggered.emit()
            this._toasts.sendToast({
              id: 'updateGroup',
              type: 'success',
              stringHTML: '<p><b>' + group.name + '</b> was updated.</p>',
              links: []
            })
          },
          error => {
            console.error(error);

            this._toasts.sendToast({
              id: 'updateGroup',
              type: 'error',
              stringHTML: '<p>Sorry, we weren’t able to update your group. Try again later or contact <a href="http://support.artstor.org/" target="_blank">support</a>.</p>',
              links: []
            })
            this.isLoading = false;
          }
        )).subscribe()
      // if an Artstor user, make sure the public property is set correctly
      if (this.isArtstorUser) {
        this.changeGlobalSetting(group, formValue.artstorPermissions == 'global')
      }
    }
    else {
      // analytics events
      if (this.copyIG) {
        // Copying old group
        this._angulartics.eventTrack.next({ properties: { event: 'copyGroup', category: 'groups', label: this.ig.id }})
      } else {
        // Create New Group
        this._angulartics.eventTrack.next({ properties: { event: 'newGroup', category: 'groups' }})
      }

      // create the group using the group service
      this._group.create(group).pipe(
        map(data => {
          this.isLoading = false
          this.newGroup = data
          this.serviceResponse.success = true
          this._assets.clearSelectMode.next(true)

          // if an Artstor user, make sure the public property is set correctly
          if (this.isArtstorUser) {
            this.changeGlobalSetting(this.newGroup, formValue.artstorPermissions == 'global')
          }

          if (this.copyIG && this.ig && this.ig.id) {
            // Log copy group event into Captain's Log
            this._log.log({
              eventType: 'artstor_copy_group',
              additional_fields: {
                'source_group_id': this.ig.id,
                'group_id': this.newGroup.id
              }
            })
          }
          else {
            // Log create group event into Captain's Log
            this._log.log({
              eventType: 'artstor_create_group',
              additional_fields: {
                'group_id': this.newGroup.id
              }
            })

            // Add detail to group GA event
            if (data.items[0].zoom && data.items[0].zoom.pointWidth) {
              this._angulartics.eventTrack.next({ properties: { event: 'addDetail', category: 'groups', label: 'new group' }})
            }

            // Add to Group GA event
            this._angulartics.eventTrack.next({ properties: { event: 'addToGroup', category: 'groups', label: this.router.url }})
          }

          this.closeModal.emit()
          this._toasts.sendToast({
            id: 'createNewGroup',
            type: 'success',
            stringHTML: '<p>' + (multipleSelected ? 'The items were' : 'The item was') + ' added to your new group, <b>' + data.name + '</b>.</p>',
            links: [{
              routerLink: ['/group/'+ data.id],
              label: 'Go to group'
            }]
          })
        },
        error => {
          console.error(error)
          this.errorMsg = '<p>Sorry, we weren’t able create the new group or add the '+ (group.items.length > 1 ? 'items' : 'item') +' at this time. Try again later or contact <a href="http://support.artstor.org/">support</a>.</p>'
          this.serviceResponse.failure = true
          this.isLoading = false;
        }
      )).subscribe()
    }
  }

  /**
   * Sets the values of form members based on the injected image group
   */
  private setFormValues(): void {
    // let igCopy = Object.assign({}, this.ig)
    // set title value
    this.newIgForm.controls['title'].setValue(this.ig.name);

    // Make copy of array to break pointers
    let tagsCopy = this.ig.tags.slice(0)
    // Set tags values
    this.newIgForm.controls['tags'].setValue(tagsCopy);

    if (this.ig.public) { this.newIgForm.controls['artstorPermissions'].setValue('global') }
    else if (this.institutionView()) { this.newIgForm.controls['artstorPermissions'].setValue('institution') }

    // TO-DO: Verify changing and saving description HTML is working correctly without old workaround
    this.igDescription =  this.ig.description
  }

  /**
   * Checks if the user's institution has permission to view the image group
   * @returns true if the user's institution has permission to view the image group
   */
  private institutionView(): boolean {
    let institutionView = false
    for (let accessObj of this.ig.access) {
      if (accessObj.entity_type === 200) {
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

    this._group.updateIgPublic(group.id, isPublic).pipe(
      take(1),
      map(res => {
        // not really sure what to do here?
      }, (err) => {
        console.error(err)
        // also not really sure what to do here...
    })).subscribe()
  }

}
