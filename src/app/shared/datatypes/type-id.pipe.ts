import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'typeIdPipe'
})

export class TypeIdPipe implements PipeTransform {
  private objectTypeNames: { [key: number]: string } = {
    1: 'specimen',
    2: 'visual',
    3: 'use',
    6: 'publication',
    7: 'synonyms',
    8: 'people',
    9: 'repository',
    10: 'image',
    11: 'panorama', // used in styles
    12: 'audio',
    13: '3d', // used in styles
    20: 'pdf', // used in styles
    21: 'ppt', // used in styles
    22: 'doc', // used in styles
    23: 'xls', // used in styles
    24: 'video' // used in styles
  };

  private objectTypeLabels: { [key: number]: string } = {
    1: 'Specimen Media',
    2: 'Visual',
    3: 'Use',
    6: 'Publication',
    7: 'Synonyms',
    8: 'People',
    9: 'Repository',
    10: 'Image',
    11: 'Panoramic Image', // used in styles
    12: 'Audio File',
    13: '3D Object', // used in styles
    20: 'PDF Document', // used in styles
    21: 'PowerPoint Document', // used in styles
    22: 'Word Document', // used in styles
    23: 'Excel Document', // used in styles
    24: 'Video File' // used in styles
  };

  // perhaps could take a 'style' or 'name' arg, depending on if you want abbrevs?
  transform(value: any, returnLabel?: boolean): any {
    let referenceObject = returnLabel ? this.objectTypeLabels : this.objectTypeNames

    if (typeof value === 'string') {
      for (let property in referenceObject) {
        if (referenceObject[property] === value) { return property; }
      }
    } else if (typeof value === 'number') {
      return referenceObject[value];
    } else {
      throw new Error('type ' + (typeof value) + ' not recognized by typeIdPipe');
    }
  }
}
