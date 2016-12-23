/**
 * Structure to be implemented in a tag component (can be constructed and then injected into a component to implement view)
 */
export class Tag {
  //in constructor
  tagId: string;
  title: string;
  isCollapsed: boolean = false;
  parentTag: Tag;
  /** object with assignable properties to be stored by the tag */
  type: any = {};

  //in functions
  /** array of tags that are categorized beneath this tag */
  private children: Tag[] = [];
  /** number of parents that the tag has */
  private levelsDeep: number = 0;
  /** has getters and setters - allows implementation to determine when touched is set */
  touched: boolean = false;

  //type can be: 'collection', 'category', or 'subcategory'
  constructor(tagId: string, title: string, isCollapsed?: boolean, parentTag?: Tag, type?: any) {
    this.tagId = tagId;
    this.title = title;
    this.isCollapsed = isCollapsed;
    this.parentTag = parentTag;
    this.type = type;
    this.levelsDeep = this.setLevel();
  }

  /**
   * Sets the tag's array of children
   * @param children An array of tags which become children of the parent tag
   */
  public setChildren(children: Tag[]): void {
    this.children = children;
    this.touched = true;
  }

  /**
   * Getter method for tag's array of children
   */
  public getChildren(): Tag[] {
    return this.children;
  }

  /** Getter method for number of tag ancestors */
  public getLevel(): number {
    return this.levelsDeep;
  }

  /**
   * Figures out how many tags are above this tag so that the consumer doesn't have to control it
   * @returns Number of parent tags
   */
  private setLevel(): number {
    let level: number = 0;
    let currentTag: Tag = this;

    while (currentTag.parentTag) {
      level++;
      currentTag = currentTag.parentTag;
    }

    return level;
  }
}