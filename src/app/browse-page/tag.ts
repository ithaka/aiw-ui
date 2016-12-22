export class Tag {
  tagId: string;
  title: string;
  isOpen: boolean;
  parentId: string;
  

  constructor(tagId: string, title: string, isCollapsed?: boolean, parentId?:string) {
    this.tagId = tagId;
    this.title = title;
    this.parentId = parentId;
  }
}