import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'typeIdPipe'
})

export class PipeNamePipe implements PipeTransform {
  private objectTypeNames: { [key: number] : string } = {
      1: 'specimen',
      2: 'visual',
      3: 'use',
      6: 'publication',
      7: 'synonyms',
      8: 'people',
      9: 'repository', 
      10: 'image',
      11: 'qtvr',
      12: 'audio',
      13: '3d',
      21: 'powerpoint',
      22: 'document',
      23: 'excel',
      24: 'kaltura'
  };

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