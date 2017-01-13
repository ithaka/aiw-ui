import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'typeIdPipe'
})

export class TypeIdPipe implements PipeTransform {
  private objectTypeNames: { [key: number] : string } = {
    1: 'specimen',
    2: 'visual',
    3: 'use',
    6: 'publication',
    7: 'synonyms',
    8: 'people',
    9: 'repository', 
    10: 'image',
    11: 'qtvr', // used in styles
    12: 'audio',
    13: '3d', // used in styles
    20: 'pdf', // used in styles
    21: 'ppt', // used in styles
    22: 'doc', // used in styles
    23: 'excel',
    24: 'kaltura'
  };

  // perhaps could take a 'style' or 'name' arg, depending on if you want abbrevs?
  transform(value: any): any {
    if (typeof value === 'string') {
      for (let property in this.objectTypeNames) {
        if (this.objectTypeNames[property] === value) { return property; }
      }
    } else if (typeof value === 'number') {
      return this.objectTypeNames[value];
    } else {
      throw new Error("type " + (typeof value) + " not recognized by typeIdPipe");
    }
  }
}