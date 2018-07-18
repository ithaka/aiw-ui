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
} from './asset-search.service'

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
  beforeEach(() => TestBed.configureTestingModule({
    providers: [ { provide: AssetSearchService }]
  }));

  fit('initial AssetSearchService should be of type AssetSearchService', inject([AssetSearchService], (searchService: AssetSearchService) => {

    expect(typeof(searchService)).toBe('AssetSearchService')
    // searchService.search().take(1).subscribe(
    //   data => {
    //     expect(data.size).toBe(24);
    //   }
    // );
  }));

  // it('should have default data', inject([ Search ], (search: Search) => {
  //   expect(Search.localState).toEqual({ value: '' });
  // }));

  // it('should have a title', inject([ Search ], (search: Search) => {
  //   expect(!!Search.title).toEqual(true);
  // }));

  // it('should log ngOnInit', inject([ Search ], (search: Search) => {
  //   spyOn(console, 'log');
  //   expect(console.log).not.toHaveBeenCalled();

  //   Search.ngOnInit();
  //   expect(console.log).toHaveBeenCalled();
  // }));

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
