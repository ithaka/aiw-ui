import { Router } from '@angular/router';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

// Project Dependencies
import { GroupService, AssetService } from './../../shared';
import { AnalyticsService } from './../../analytics.service';

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
  ig: any;

  @Input()
  igName: string;

  private groupDeleted: boolean = false;

  constructor(
        private _group: GroupService, 
        private _assets: AssetService,
        private _router: Router,
        private _analytics: AnalyticsService
      ) { }

  ngOnInit() {
    if(this.ig.id){
      this.igName = this.ig.name;
    }
  }

  deleteImageGroup(): void{
    this._analytics.directCall('delete_img_group')
    
    this._group.delete(this.igId).subscribe(res =>{
      if(res){
        // Clear Group Assets locally
        this._assets.clearAssets();
        this.groupDeleted = true;
      }
    });
  }

}
