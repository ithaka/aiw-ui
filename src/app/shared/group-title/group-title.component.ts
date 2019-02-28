import { Component, Input, OnInit } from '@angular/core'
import { ImageGroup } from './../'

@Component({
    selector: 'ang-group-title',
    templateUrl: 'group-title.component.pug',
    styleUrls: ['./group-title.component.scss']
  })
  export class GroupTitleComponent {
    @Input()
    public ig: ImageGroup

    constructor(
    ){ }

}