import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs/Rx';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';

import { AssetService, PersonalCollectionService } from './../../shared';

@Component({
  selector: 'ang-edit-personal-collection',
  styleUrls: [ 'edit-personal-collection.component.scss' ],
  templateUrl: 'edit-personal-collection.component.pug'
})
export class EditPersonalCollectionModal implements OnInit, OnDestroy {
  @Output() closeModal: EventEmitter<any> = new EventEmitter();
  @Input() private colId: string;

  private subscriptions: Subscription[] = [];

  private pcColThumbs: Array<any> = [];
  private editMode: boolean = false;
  private selectedAsset: any;

  private editAssetMetaForm: FormGroup;

  constructor(
    private _fb: FormBuilder,
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
    // console.log(this.colId);
    if(this.colId){
      this.loadPCThumbnails();
    }
  }

  ngOnDestroy() {
      this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  private loadPCThumbnails(): void{
    this._assets.getCollectionThumbs(this.colId)
      .then((res) => {
          this.pcColThumbs = res['thumbnails'];
          for(let thmb of this.pcColThumbs){
            thmb.metaData = JSON.parse(thmb.jsonListSt);
            this.formatMetadata(thmb);
          }
      })
      .catch(function(err) {
          console.log('Unable to load Personal Collection thumbnails.');
      });
  }


  private formatMetadata(thmbObj){
    let metaArray = {};
    for(let data of thmbObj.metaData){
      if( metaArray[ data.fieldName ] ){
        metaArray[ data.fieldName.toLowerCase() ] += '|' + data.fieldValue;
      }
      else{
        metaArray[ data.fieldName.toLowerCase() ] = data.fieldValue;
      }

    }

    thmbObj.formattedMetaArray = metaArray;
  }

  private editAssetMeta(asset: any): void{
    this.selectedAsset = asset;

    this.editAssetMetaForm.controls['creator'].setValue(this.selectedAsset['formattedMetaArray']['creator']);
    this.editAssetMetaForm.controls['title'].setValue(this.selectedAsset['formattedMetaArray']['title']);
    this.editAssetMetaForm.controls['work_type'].setValue(this.selectedAsset['formattedMetaArray']['work_type']);
    this.editAssetMetaForm.controls['date'].setValue(this.selectedAsset['formattedMetaArray']['date']);
    this.editAssetMetaForm.controls['location'].setValue(this.selectedAsset['formattedMetaArray']['location']);
    this.editAssetMetaForm.controls['material'].setValue(this.selectedAsset['formattedMetaArray']['material']);
    this.editAssetMetaForm.controls['description'].setValue(this.selectedAsset['formattedMetaArray']['description']);
    this.editAssetMetaForm.controls['subject'].setValue(this.selectedAsset['formattedMetaArray']['subject']);

    this.editMode = true;
    console.log(this.selectedAsset);
  }

  private clearSelectedAsset(): void{
    this.selectedAsset = {};
    this.editMode = false;
  }

  private editMetaFormSubmit( formData: any ): void{
    console.log(formData);
  }

  private deleteSelectedAsset(SSID: string): void {
    console.log('deleting ' + SSID)
    console.log(this.selectedAsset)
    this._pc.deletePersonalAssets([this.selectedAsset.objectId])
      .take(1)
      .subscribe((res) => {
        console.log(res)
      }, (err) => {
        console.error(err)
      })
  }

}
