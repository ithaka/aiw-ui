import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'filterLink',  pure: false })
export class FilterLinkPipe implements PipeTransform {
    transform(value: any, filterKey: string): any {
        let values = value.split(/(?!;).|\|/g)
        // [routerLink]="['/search', 'artcreator:(' + value + ')']"
        let linkHtml = ''
        values.forEach(value => {
            linkHtml += `<a href="/#/search;${filterKey}:(${value})">${value}</a>-`
        })
        return linkHtml
    }
}
