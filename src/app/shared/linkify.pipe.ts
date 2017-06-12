import { Pipe, PipeTransform } from '@angular/core';
// import linkifyStr from 'linkifyjs/string';

var linkifyStr = require('linkifyjs/string');

@Pipe({name: 'linkify'})
export class LinkifyPipe implements PipeTransform {
  transform(str: string): string {
    return str ? linkifyStr(str, {target: '_system'}) : str;
  }
}