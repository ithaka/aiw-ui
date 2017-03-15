import { Router } from '@angular/router';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

// Project Dependencies
import { GroupService, AssetService } from './../../shared';

@Component({
  selector: 'ang-delete-ig-modal',
  templateUrl: 'delete-ig.component.html',
  providers: [
    GroupService
  ]
})
export class DeleteIgModal implements OnInit {
  @Output()
  closeModal: EventEmitter<any> = new EventEmitter();

  @Input()
  igId: string;

  @Input()
  igName: string;

  private groupDeleted: boolean = false;

  constructor(
      private _group: GroupService, 
      private _assets: AssetService,
      private _router: Router) { }

  ngOnInit() {
    
  }

  deleteImageGroup(): void{
    this._group.delete(this.igId).subscribe(res =>{
      if(res){
        // Clear Group Assets locally
        this._assets.clearAssets();
        this.groupDeleted = true;
      }
    });
  }

}
