import { Component, Input, Output, EventEmitter } from '@angular/core';

import { AssetService } from '../../shared/assets.service';
import { TagsService } from '../tags.service';
import { Tag } from './tag.class';

@Component({
  selector: 'ang-tag',
  templateUrl: 'tag.component.pug',
  styleUrls: ['./tag.component.scss']
})
export class TagComponent {

  @Input() public tag: Tag;
  @Input() public link: boolean;
  @Input() public browseType: boolean;

  @Input() public edit: boolean;
  @Output() editTag: EventEmitter<any> = new EventEmitter();

  private showAsFolder: boolean;
  public linkRoute: string = '';
  public showDescription: boolean = false;
  private loading: boolean = false;

  constructor(
    private _assets: AssetService,
    private _tags: TagsService
  ) {

  }

  ngOnInit() {
    if (this.tag.type) {
      if (this.tag.type.label === 'collection') {
        this.linkRoute = '/collection';
      }
      if (this.tag.type.label === 'pcollection' || this.tag.type.label === 'privateCollection') {
        this.linkRoute = '/pcollection';
      }
      if (this.tag.type.label === 'group' && this.tag.type.folder !== true) {
        this.linkRoute = '/group';
      }
      if (this.tag.type.label === 'category') {
        this.linkRoute = '/category';
      }
    }
  }

  toggleDescription(): void {
    this.showDescription = !this.showDescription;
  }

  /**
   * Collection/Category titles often have the count appended to the title
   * We want to remove these parantheses wrapping the count for:
   * - Cleaner formatting
   * - Simpler route behavior (can't pass paranthesis as a route)
   */
  private cleanTitle(title: string): string {
    return title.replace(/[\(\)]/g, '');
  }
}
