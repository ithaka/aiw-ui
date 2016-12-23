export class Tag {
  //in constructor
  tagId: string;
  title: string;
  isCollapsed: boolean = false;
  parentId: string;
  type: string;

  //in functions
  private children: Tag[];
  isDisplayed: boolean = true;
  levelsDeep: number = 0;

  //type can be: 'collection', 'category', or 'subcategory'
  constructor(tagId: string, title: string, isCollapsed?: boolean, parentId?: string, type?: string) {
    this.tagId = tagId;
    this.title = title;
    this.isCollapsed = isCollapsed;
    this.parentId = parentId;
    this.type = type;
  }

  public setChildren(children: Tag[]): void {
    this.children = children;
  }

  public getChildren(): Tag[] {
    return this.children;
  }

  public toggleDisplay(): void {
    this.isDisplayed = !this.isDisplayed;
  }

  public getLevel(): number {
    return this.levelsDeep;
  }

  public setLevel(level: number): void {
    this.levelsDeep = level;
  }
}