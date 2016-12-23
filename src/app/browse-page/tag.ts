export class Tag {
  tagId: string;
  title: string;
  isDisplayed: boolean = true;
  isCollapsed: boolean = false;
  parentId: string;
  private children: Tag[];
  
  //type can be: 'collection', 'category', or 'subcategory'
  constructor(tagId: string, title: string, isCollapsed?: boolean, parentId?: string, type?: string) {
    this.tagId = tagId;
    this.title = title;
    this.isCollapsed = isCollapsed;
    this.parentId = parentId;
  }

  public setChildren(children: Tag[]): void {
    this.children = children;
  }

  public getChildren(): Tag[] {
    return this.children;
  }

  public setDisplay(display: boolean): void {
    this.isDisplayed = display;
  }

  public getDisplay(): boolean {
    return this.isDisplayed;
  }

  public toggleDisplay(): void {
    this.isDisplayed = !this.isDisplayed;
  }
}