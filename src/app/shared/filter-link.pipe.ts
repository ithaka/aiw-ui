import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'filterLink',  pure: false })
export class FilterLinkPipe implements PipeTransform {
    transform(value: any, filterKey: string): any {
        let values: string[] = []
        let restoreChar: string = ''
        let breakChar: string = '<br/>'
        // Semicolons - handle splitting
        values = value.split(/;\s/g)
        if (values.length > 1) {
            restoreChar = ';'
            breakChar = '<span>&ensp;</span>'
        } else {
            // Pipes - handle splitting
            values = value.split(/\|/g)
        }
        // Build search links wrapping field value
        let linkHtml = ''
        values.forEach((value, index) => {
            if (index == (values.length - 1)) restoreChar = ''
            linkHtml += `<a href="/#/search/${filterKey}:(${value})">${value}</a>${restoreChar}${breakChar}`
        })
        return linkHtml
    }
}
 
