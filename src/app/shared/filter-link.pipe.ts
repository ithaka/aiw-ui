import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'filterLink',  pure: false })
export class FilterLinkPipe implements PipeTransform {
    transform(value: any, filterKey: string): any {
        let values: string[] = []
        let restoreChar: string = ''
        // Semicolons - handle splitting
        values = value.split(/;\s/g)
        if (values.length > 1) {
            restoreChar = ';'
        } else {
            // Pipes - handle splitting
            values = value.split(/\|/g)
        }
        // Build search links wrapping field value
        let linkHtml = ''
        values.forEach((value, index) => {
            if (index == (values.length - 1)) restoreChar = ''
            linkHtml += `<a href="/#/search;${filterKey}:(${value})">${value}</a>${restoreChar}<span>&ensp;</span>`
        })
        return linkHtml
    }
}
 