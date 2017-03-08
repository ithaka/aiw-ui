import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { GroupService } from './../../shared';

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

  constructor(private _group: GroupService) { }

  ngOnInit() { console.log(this.igId); }

  deleteImageGroup(): void{
    this._group.delete(this.igId).subscribe(res =>{
      if(res){
        console.log(res);
        this.closeModal.emit();
      }
    });
  }
}
