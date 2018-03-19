import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core'
import { Subscription } from 'rxjs/Rx'
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms'


import { AssetService, PersonalCollectionService, AssetSearchService, SearchAsset, AuthService, PostPersonalCollectionResponse } from './../../shared'
import { Asset } from '../../asset-page/asset'

@Component({
  selector: 'ang-edit-personal-collection',
  styleUrls: [ 'edit-personal-collection.component.scss' ],
  templateUrl: 'edit-personal-collection.component.pug'
})
export class EditPersonalCollectionModal implements OnInit, OnDestroy {
  @Output() closeModal: EventEmitter<any> = new EventEmitter()
  @Input() private colId: string

  private subscriptions: Subscription[] = []

  private pcColThumbs: Array<any> = []
  private collectionAssets: Array<SearchAsset>
  private editMode: boolean = false
  private selectedAsset: SearchAsset // this is the asset which the user selects from the list of assets
  private selectedAssetData: Asset // the asset emitted from the viewer

  private editAssetMetaForm: FormGroup

  private uiMessages: {
    imgUploadSuccess?: boolean,
    imgUploadFailure?: boolean,
    metadataUpdateSuccess?: boolean,
    metadataUpdateFailure?: boolean,
    imgDeleteSuccess?: boolean,
    imgDeleteFailure?: boolean
  } = {}

  private deleteLoading: boolean = false // state before delete call has returned
  private metadataUpdateLoading: boolean = false

  constructor(
    private _fb: FormBuilder,
    private _auth: AuthService,
    private _search: AssetSearchService,
    private _assets: AssetService,
    private _pc: PersonalCollectionService
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
    this._search.search({ colId: "37436" }, "", 4)
    .take(1)
    .subscribe((res) => {
      this.collectionAssets = res.results
    }, (err) => {
      console.error(err)
    })
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe() })
  }

  private handleLoadedMetadata(metadata: Asset): void {
    if (metadata['error']) {
      return console.error(metadata['error'])
      // handle us that error
    }

    this.selectedAssetData = metadata

    this.editAssetMetaForm.controls['creator'].setValue(this.selectedAssetData.creator)
    this.editAssetMetaForm.controls['title'].setValue(this.selectedAssetData.title)
    this.editAssetMetaForm.controls['work_type'].setValue(this.selectedAssetData.formattedMetadata.work_type)
    this.editAssetMetaForm.controls['date'].setValue(this.selectedAssetData.date)
    this.editAssetMetaForm.controls['location'].setValue(this.selectedAssetData.formattedMetadata.location)
    this.editAssetMetaForm.controls['material'].setValue(this.selectedAssetData.formattedMetadata.material)
    this.editAssetMetaForm.controls['description'].setValue(this.selectedAssetData.description)
    this.editAssetMetaForm.controls['subject'].setValue(this.selectedAssetData.formattedMetadata.subject)
  }

  private editAssetMeta(asset: SearchAsset): void{
    this.selectedAsset = asset

    this.editMode = true
  }

  private clearSelectedAsset(): void {
    this.selectedAsset = <SearchAsset>{}
    this.selectedAssetData = <Asset>{}
    this.editMode = false
  }

  private editMetaFormSubmit( formData: any ): void {
    if (this.metadataUpdateLoading) { return }

    this.uiMessages = {}
    this.metadataUpdateLoading = true
    // TODO: add trigger for success and failure messages
    console.log(formData)
    this.metadataUpdateLoading = false
  }

  /**
   * Removes the selected asset from the array of thumbnails
   */
  private removeSelectedAsset(): void {
    this.collectionAssets.splice(this.collectionAssets.indexOf(this.selectedAsset), 1)
  }

  /**
   * Uses personal collection service to make http call and delete asset
   * @param ssid the ssid of the asset to delete
   */
  private deleteAssetById(ssid: string): void {
    if (this.deleteLoading) { return }

    this.uiMessages = { }
    this.deleteLoading = true
    
    this._pc.deletePersonalAssets([ssid])
    .map((res) => {
      this.deleteLoading = false
      return res
    })
    .take(1)
    .subscribe((res) => {
      this.uiMessages.imgDeleteSuccess = true
      this.removeSelectedAsset()
      this.clearSelectedAsset()
    }, (err) => {
      console.error(err)
      this.uiMessages.imgDeleteFailure = true
    })
  }

  // private deleteAssetById(ssid: string): void {
  //   console.log('deleting', ssid)
  //   this.messages = {}

  //   this.messages.imgDeleteSuccess = true
  //   // this.removeSelectedAsset()
  //   // this.clearSelectedAsset()

  //   // this._pc.deletePersonalAssets([ssid])
  //   //   .take(1)
  //   //   .subscribe((res) => {
  //   //     this.messages.imgDeleteSuccess = true
  //   //     this.removeSelectedAsset()
  //   //     this.clearSelectedAsset()
  //   //   }, (err) => {
  //   //     console.error(err)
  //   //     this.messages.imgDeleteFailure = true
  //   //   })
  // }

  private handleNewAssetUpload(item: PostPersonalCollectionResponse): void {
    this.uiMessages = {}

    console.log('got that file done', item)
    let newAsset: any = {
      name: item.filename,
      thumbnailUrls: [item.src],
      ssid: item.ssid
    }

    // // hacks together a SearchAsset from the ExpandedFileItem information
    // this.collectionAssets.push()
    
    // this.collectionAssets.push(item)
    this.collectionAssets.unshift(newAsset)
  }
  
}