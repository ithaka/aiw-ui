/**
 * Structure to be implemented in a tag component (can be constructed and then injected into a component to implement view)
 */
export class Tag {
  // in constructor
  tagId: string;
  title: string;
  isCollapsed: boolean = false;
  canOpen: boolean = false;
  parentTag: Tag;
  /** object with assignable properties to be stored by the tag
   *  common properties:
   *  isFolder : true/false
   *  label : 'group' or 'collection'
  */
  type: any = {};
  /** Used for showing Image Group and Collection Description */
  public description: string = '';
  public thumbnail: string = '';

  // in functions
  /** array of tags that are categorized beneath this tag */
  public children: Tag[] = [];
  /** number of parents that the tag has */
  private levelsDeep: number = 0;
  /** has getters and setters - allows implementation to determine when touched is set */
  touched: boolean = false;

  // type can be: 'collection' or 'category'
  constructor(tagId: string, title: string, isCollapsed?: boolean, parentTag?: Tag, type?: any, canOpen ?: boolean) {
    this.tagId = tagId;
    this.title = title;
    this.isCollapsed = isCollapsed;
    this.parentTag = parentTag;
    this.canOpen = !!canOpen;

    if (type) {
      this.type = type;
      // A disappointing number of booleans come back as strings...
      this.type.folder = (type.folder === 'true' || type.folder === true) ?  true : false;
    } else {
      this.type = {label: 'category'};
    }

    this.levelsDeep = this.setLevel();
  }

  /**
   * Sets the tag's array of children
   * @param children An array of tags which become children of the parent tag
   */
  public setChildren(children: Tag[]): void {
    this.children = children;
    // this.touched = true;
  }

  /**
   * Sets the tags Description property
   * @param description as a string
   */
  public setDescription(description: string): void {
    this.description = description;
  }

  public setThumbnail(thumbUrl: string): void {
    this.thumbnail = thumbUrl;
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
