import { Pipe, PipeTransform } from '@angular/core';
// import { linkifyStr } from 'linkifyjs/string';

var linkifyHtml = require('linkifyjs/html');

@Pipe({name: 'linkify'})
export class LinkifyPipe implements PipeTransform {
  transform(str: string): string {
    //return str ? linkifyElement(str, {target: '_blank', events:{click:function(e){console.log('Link clicked!');}}}) : str;
    return str ? linkifyHtml(str, {target: '_blank'}) : str;
  }
}