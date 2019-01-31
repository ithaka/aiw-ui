import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'adlcolfilter',  pure: false })
export class AdlCollectionFilterPipe implements PipeTransform {
    transform(items: any[], filter: string): any {
      // Return classification items
      if (!items.length || !filter || !filter.length) {
        return items;
      }

      // Filter ADL Collections on title field
      let regex = new RegExp(filter, "i")
      items = items.filter(item => { return item.title.match(regex) ? true : false })
      return items
    }
}
