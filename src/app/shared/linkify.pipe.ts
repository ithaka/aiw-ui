import { Pipe, PipeTransform } from '@angular/core';
// import { linkifyStr } from 'linkifyjs/string';

var linkifyHtml = require('linkifyjs/html');

@Pipe({name: 'linkify'})
export class LinkifyPipe implements PipeTransform {
  transform(str: string): string {
    return str ? linkifyHtml(str, {
      target: '_blank', 
      events: {
        click: function (e) {
          alert('Link clicked!');
        },
        mouseover: function (e) {
          alert('Link hovered!');
        }
      }
    }) : str;
  }
}