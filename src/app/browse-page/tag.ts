export class Tag {
  //in constructor
  tagId: string;
  title: string;
  isCollapsed: boolean = false;
  parentTag: Tag;
  type: string;

  //in functions
  private children: Tag[];
  isDisplayed: boolean = true;
  levelsDeep: number = 0;
  touched: boolean = false;

  //type can be: 'collection', 'category', or 'subcategory'
  constructor(tagId: string, title: string, isCollapsed?: boolean, parentTag?: Tag, type?: string) {
    this.tagId = tagId;
    this.title = title;
    this.isCollapsed = isCollapsed;
    this.parentTag = parentTag;
    this.type = type;
  }

  public setChildren(children: Tag[]): void {
    this.children = children;
  }

  public getChildren(): Tag[] {
    return this.children;
  }

  public toggleChildren(): void {
    this.touched = true;

    // loop through all of this tag's children
    for(let child of this.children) {
      // toggle all of that tag's children
      child.isDisplayed = !child.isDisplayed;

      // if it has children, toggle them!
      if (child.getChildren()) {
        child.toggleChildren();
      }
    }
  }

  public getLevel(): number {
    return this.levelsDeep;
  }

  public setLevel(level: number): void {
    this.levelsDeep = level;
  }
}