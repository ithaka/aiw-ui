import { Pipe, PipeTransform } from '@angular/core';

var linkifyHtml = require('linkifyjs/html');

@Pipe({name: 'linkify'})
export class LinkifyPipe implements PipeTransform {
  transform(str: string): string {
    return str ? linkifyHtml(str, { target: '_blank', validate: { url: function (value) { return /^(http|ftp)s?:\/\//.test(value) } } }) : str;
  }
}
