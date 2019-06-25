import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, AfterViewInit } from '@angular/core'
import { Subscription } from 'rxjs'
import { map, take } from 'rxjs/operators'
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms'


import {
  AssetService,
  PersonalCollectionService,
  AssetSearchService,
  SearchAsset,
  AuthService,
  PersonalCollectionUploadAsset,
  AssetDetailsFormValue
} from '_services'
import { Asset } from '../../asset-page/asset'
import { LocalPCService, LocalPCAsset } from '../../_local-pc-asset.service'

@Component({
  selector: 'ang-edit-personal-collection',
  styleUrls: [ 'edit-personal-collection.component.scss' ],
  templateUrl: 'edit-personal-collection.component.pug'
})
export class EditPersonalCollectionModal implements OnInit, AfterViewInit {
  @Output() closeModal: EventEmitter<any> = new EventEmitter()
  @Input() public colId: string

  public pcColThumbs: Array<any> = []
  public collectionAssets: Array<PersonalCollectionUploadAsset> = []
  public editMode: boolean = false
  public selectedAsset: PersonalCollectionUploadAsset // this is the asset which the user selects from the list of assets
  public selectedAssetData: AssetDetailsFormValue = {} // the asset emitted from the viewer

  public editAssetMetaForm: FormGroup

  public uiMessages: {
    imgUploadSuccess?: boolean,
    imgUploadFailure?: boolean,
    metadataUpdateSuccess?: boolean,
    metadataUpdateFailure?: boolean,
    imgDeleteSuccess?: boolean,
    imgDeleteFailure?: boolean
  } = {}
  public submitted: boolean = false // keeps track of whether or not the form was submitted

  public metadataUpdateLoading: boolean = false

  constructor(
    public _fb: FormBuilder,
    public _auth: AuthService,
    public _search: AssetSearchService,
    public _assets: AssetService,
    public _pc: PersonalCollectionService,
    public _localPC: LocalPCService
  ) {
    this.editAssetMetaForm = _fb.group({
      creator: [null],
      title: [null, Validators.required],
      work_type: [null],
      date: [null],
      location: [null],
      material: [null],
      description: [null],
      subject: [null]
    })
  }


  ngOnInit() {
  }

  ngAfterViewInit() {
    this.startModalFocus()
  }

  // Set initial focus on the modal Title h1
  public startModalFocus() {
    let element = <HTMLElement>(document.querySelector('.modal-title'))
    element.focus()
  }

  public setMetadataValues(asset: LocalPCAsset): void {
    if (asset) {
      this.selectedAssetData = asset.asset_metadata
    } else {
      this.selectedAssetData = <AssetDetailsFormValue>{}
    }

    this.editAssetMetaForm.controls['creator'].setValue(this.selectedAssetData.creator)
    this.editAssetMetaForm.controls['title'].setValue(this.selectedAssetData.title)
    this.editAssetMetaForm.controls['work_type'].setValue(this.selectedAssetData.work_type)
    this.editAssetMetaForm.controls['date'].setValue(this.selectedAssetData.date)
    this.editAssetMetaForm.controls['location'].setValue(this.selectedAssetData.location)
    this.editAssetMetaForm.controls['material'].setValue(this.selectedAssetData.material)
    this.editAssetMetaForm.controls['description'].setValue(this.selectedAssetData.description)
    this.editAssetMetaForm.controls['subject'].setValue(this.selectedAssetData.subject)
  }

  public editAssetMeta(asset: PersonalCollectionUploadAsset): void{
    this.uiMessages = {}
    this.submitted = false // reset this value for a new metadata form

    this.selectedAsset = asset
    this.setMetadataValues(this._localPC.getAsset(this.selectedAsset.ssid)) // update the form values to match the new asset metadata

    this.editMode = true

    // Focus on the first element of the form
    setTimeout( () => {
      let element = <HTMLElement>(document.querySelector('#editAssetMetaForm input'))
      element.focus()
    }, 250)
  }

  public clearSelectedAsset(): void {
    this.selectedAsset = <PersonalCollectionUploadAsset>{}
    this.selectedAssetData = <AssetDetailsFormValue>{}
    this.editMode = false
  }

  public editMetaFormSubmit( formData: AssetDetailsFormValue ): void {
    this.submitted = true

    if (this.metadataUpdateLoading) { return }
    if (!this.editAssetMetaForm.valid) { return }

    this.uiMessages = {}
    this.metadataUpdateLoading = true
    
    this._pc.updatepcImageMetadata(formData, String(this.selectedAsset.ssid)).pipe(
    map(res => {
      this.metadataUpdateLoading = false
      return res
    })).pipe(
      take(1),
      map(res => {
        let updateItem = res.results.find((result) => {
          return result.ssid == String(this.selectedAsset.ssid)
        })

        if (updateItem.success) {
          this.uiMessages.metadataUpdateSuccess = true
          // store this asset in local storage to be loaded later
          this._localPC.setAsset({
            ssid: this.selectedAsset.ssid, // typescript doesn't know that javascript can convert numbers to strings :(
            asset_metadata: formData
          })
        } else {
          this.uiMessages.metadataUpdateFailure = true
        }

      }, (err) => {
        this.uiMessages.metadataUpdateFailure = true
        console.error(err)
    })).subscribe()
  }


  public handleNewAssetUpload(item: PersonalCollectionUploadAsset): void {
    this.uiMessages = {}

    this.collectionAssets.unshift(item)

    // Track the SSIDs (in local storage) for recently uploaded assets untill they get available in SOLR
    if (item.ssid){
      let publishingAssets = this._auth.getFromStorage('publishingAssets')
      if (!publishingAssets){
        publishingAssets = {
          ssids: [],
          showPublishingMsgs: true
        }
      }
      publishingAssets.ssids.push(item.ssid)
      publishingAssets.showPublishingMsgs = true
      this._auth.store('publishingAssets', publishingAssets)
    }

    // focus on the recently uploaded asset
    setTimeout(() => {
      let element = <HTMLElement>(document.querySelector('.thumb-preview-cntnr .thumb'))
      element.focus()
    }, 250)
  }

}
