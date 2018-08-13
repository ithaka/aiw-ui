import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'iggroupfilter',  pure: false })
export class IgGroupFilterPipe implements PipeTransform {
    transform(items: any[], filter: string): any {
        // Currently check the third item's title, because on prod the first two items doesn't have a title while they should have, if we can resolve the problem when should check the first item
        // And the reason for checking the title is to make sure image groups load for Classification and Geography page
        if (!items.length || !filter || !items[2].title) {
            return items;
        }
        return items.filter(item => item.title.toLowerCase().indexOf(filter.toLowerCase()) > -1)
    }
}
