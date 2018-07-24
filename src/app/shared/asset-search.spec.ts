/* tslint:disable:no-unused-variable */
import { inject, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
// import { BaseRequestOptions, ConnectionBackend, Http } from '@angular/http';
// import { MockBackend } from '@angular/http/testing';

// Asset Search Service Test Dependencies
import { AssetFiltersService } from '../asset-filters/asset-filters.service';
import {
  AssetSearchService,
  SearchResponse,
  //RawSearchAsset,
  RawSearchResponse,
  // HierarchicalFilter,
} from './asset-search.service';

//import { AuthService } from './'
//import { AppConfig } from '../app.service'
//import { Observable } from 'rxjs/Observable'

/* Helper for generating search query input values */
// createSearchQuery() {}

// class genFilters {
//   public newFilter() {
//     return new HierarchicalFilter(
//       "filter key",
//       {},
//       {
//         count: 1,
//         depth: "depth value",
//         efq: "efq value",
//         label: ["label 1", "label 2"],
//         selected: false
//       }
//     )
//   }
// }

// let mockHierarchicalFilter = genFilters.newFilter

// // interface HierarchicalFilter {
// //   [key: string]: {
// //     children: HierarchicalFilter
// //     element: {
// //       count: number
// //       depth: string
// //       efq: string
// //       label: string[]
// //       selected: boolean
// //     }
// //   }

let mockSearchInput = {
  facets: {
    name: "facet name",
    values: {
      count: 1,
      efq: "efq",
      fq: "fq",
      name: "name"
    }
  },
  bad_request: false,
  requestId: '12345',
  //results: RawSearchAsset,
  total: 10, // total number of assets returned
  //hierarchies2: HierarchicalFilter
}

// let mockSearchResponse = new RawSearchResponse(
//   facets: {
//     name: string
//     values: {
//       count: number
//       efq: string
//       fq: string
//       name: string
//     }[]
//   }[]
//   bad_request: boolean
//   requestId: string
//   results: RawSearchAsset[]
//   total: number // total number of assets returned
//   hierarchies2: HierarchicalFilter
// }
// )

describe('Search Service', () => {
  // provide our implementations or mocks to the dependency injector
  beforeEach(() => {
    let assetSearch: AssetSearchService

    TestBed.configureTestingModule({
      providers: [
        { provide: AssetSearchService, useValue: {}, deps: [] }
      ]
    });
  });

  it('initial AssetSearchService should exist', inject([AssetSearchService], (assetSearch: AssetSearchService) => {
    expect(assetSearch).toBeTruthy();
  }));

  /**
   * Search assets service
   * @param keyword          String to search for.
   * @param filters       Array of filter objects (with filterGroup and filterValue properties)
   * @param sortIndex     An integer representing a type of sort.
   * @param dateFacet     Object with the dateFacet values
   * @returns       Returns an object with the properties: thumbnails, count, altKey, classificationFacets, geographyFacets, minDate, maxDate, collTypeFacets, dateFacets
   */

  it('initialize AssetSearchService search method', inject([AssetSearchService], (assetSearch: AssetSearchService) => {
    expect(assetSearch.search).toBeDefined();
  }));

});


// // the cleaned response object which is returned by the service
// export interface SearchResponse {
//   facets: {
//     name: string
//     values: {
//       count: number
//       efq: string
//       fq: string
//       name: string
//     }[]
//   }[]
//   bad_request: boolean
//   requestId: string
//   results: SearchAsset[]
//   total: number // total number of assets returned
//   hierarchies2: HierarchicalFilter
// }

// // the response directly from search
// export interface RawSearchResponse {
//   facets: {
//     name: string
//     values: {
//       count: number
//       efq: string
//       fq: string
//       name: string
//     }[]
//   }[]
//   bad_request: boolean
//   requestId: string
//   results: RawSearchAsset[]
//   total: number // total number of assets returned
//   hierarchies2: HierarchicalFilter
// }
