import { Pipe, PipeTransform } from '@angular/core';

import * as linkify from 'linkifyjs/html'

let linkifyHtml = linkify

@Pipe({name: 'linkify'})
export class LinkifyPipe implements PipeTransform {
  transform(str: string): string {
    return str ? linkifyHtml(str, { target: '_blank', validate: { url: function (value) { return /^(http[s]?:\/\/(www\.)?|ftp:\/\/(www\.)?|www\.){1}([0-9A-Za-z-\.@:%_+~#=]+)+((\.[a-zA-Z]{2,3})+)(\/(.)*)?(\?(.)*)?/.test(value.toLowerCase()) } } }) : str;
  }
}
