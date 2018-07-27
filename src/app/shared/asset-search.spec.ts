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
  RawSearchAsset,
  RawSearchResponse,
  HierarchicalFilter,
  MediaObject,
  SearchRequest,
  SearchOptions

} from './asset-search.service';
import { AppConfig } from '../app.service';
import { AuthService } from '.';
import { HttpClientModule } from '@angular/common/http';
import { WLV_ARTSTOR } from '../white-label-config';
import { SearchQueryUtil } from './search-query'; // Query filter helpers

//import { AuthService } from './'
//import { AppConfig } from '../app.service'
//import { Observable } from 'rxjs/Observable'
/** Mock Filters, MediaObject, SearchRequest, SearchOptions, SearchResponse */

/** Test values from AssetFilterService */
let filterService: AssetFiltersService
let filterNames
let filtersAvailable

// TODO: Pass in labels array, other filters array, count, and depth as params
function newFilter(): HierarchicalFilter {
  return {
    "filter key": {
      children: newFilter(),
      element: {
        count: 1, // number
        depth: "depth", // string
        efq: "efq",
        label: ["label1", "label2"], // string array
        selected: true // boolean
      }
    }
  }
}

/** Mock MediaObject */
let mockMediaObject: MediaObject = {
  format: "format", //string
  thumbnailSizeOnePath: "thumb size", //string
  width: 360, //number
  sizeInBytes: 100000, //number
  downloadSize: 700000, //number
  type: "video", //string
  icc_profile_location: "profile location", //string
  thumbnailSizeZeroPath: "zero path", //string
  filename: "fasdfafasf", //string
  lps: "lps", //string
  iiif: "iiif", //string
  storId: "sdfad", //string
  adlObjectType: 103, //number
  height: 500 //number
}

/** Mock SearchResponse */
let mockSearchResponse = {
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
  results: [],
  total: 10, // total number of assets returned
  hierarchies2: // HierarchicalFilter
    newFilter()
}

/** Mock SearchRequest
 * based on search for 'mona lisa' - without filters
*/
let mockSearchRequest: SearchRequest = {
  limit: 24, // number    <= optional
  start: 0, // number    <= optional
  content_types: ["art"], // string[]
  query: "mona lisa", // string
  // facet_fields: [{    // <= optional array of facet_fields object values
  //   name: "facet name", // string
  //   mincount: 1, // number
  //   limit: 10, // number
  // }],
  hier_facet_fields2: [{    // <= optional array of hier_facet_fields2 object values
    field: "hierarchies", // string
    hierarchy: "artstor-geography",// string
    look_ahead: 2, // number
    look_behind: -10, // number
    d_look_ahead: 1, // number
  }],
  // filter_query: ["filter val 1", "filter val 2"], // string[]    <= optional
  sortorder: "asc", // string    <= optional
  // sort: "yearend", // string    <= optional
}

/** Mock SearchOptions */
let mockSearchOptions: SearchOptions = {
  page: 1,             // number    <=optional
  size: 2,             // number    <=optional
  colId: "",           // string    <=optional
  collections: "",     // string    <=optional
  pcolId: ""           // string    <=optional
}

/** Mock RawSearchAsset */
let mockSearchAsset: RawSearchAsset = {
  agent: "creator", // creator of the piece
  artstorid: "12345", // the correct id to reference when searching for artstor assets
  clusterid: "12345", // id of the cluser the asset exists in, if any
  collections: ["collections1", "collections2"], // array of collections this asset exists under
  collectiontypenameid: ["adl", "private"],
  collectiontypes: [103, 100, 200], // all of the collection types this asset fits
  contributinginstitutionid: 103, // which institution added the asset
  date: "1970", // a string entered by the user, not an actually useful date other than display
  doi: "10.2307/artstor.16515779", // ex: "10.2307/artstor.16515779"
  frequentlygroupedwith: ["1", "2", "3"], // array of other asset ids this image is grouped with
  iap: false, // do we support Images for Academic Publishing for the asset
  // id: string // the id used by the SOLR cluster, which is not reliable, therefore it's left commented out
  media: "{ mediaobject: {} }", // this one is weird because it's a json object encoded as a string
  name: "asset name", // the asset's name
  partofcluster: false,
  tokens: ["token1", "token2"],
  type: "art", // going to be "art" for all artstor assets
  updatedon: new Date("{year:1970}"), // date the asset was last updated in Forum
  workid: "12345", // id of the work record in Forum that the asset belongs to
  year: 1970, // the year the asset is marked as being created
  yearbegin: 1970, // beginning of date range the asset is thought to have been created in
  yearend: 1970, // end of date range the asset is thought to have been created in
}

describe('Asset Search Service', () => {
  beforeEach(() => {

    filterNames = filterService.getFilterNameMap()
    filtersAvailable = filterService.getAvailable()

    TestBed.configureTestingModule({
      providers: [
        AssetSearchService,
        { provide: AssetFiltersService, useValue:{}, deps: [] },
        { provide: AppConfig, useValue: { config: WLV_ARTSTOR }, deps: [] },
        { provide: AuthService, useValue: {}, deps: [] }
      ],
      imports: [ HttpClientModule]
    });
  });

  // Test if AssetSearchService methods are defined
  fit('initial AssetSearchService exists and methods available', inject([AssetSearchService], (assetSearch: AssetSearchService) => {
    expect(assetSearch).toBeTruthy();
    expect(assetSearch.search).toBeDefined()
    expect(assetSearch.getAssetById).toBeDefined()
    expect(assetSearch.getFacets).toBeDefined()
    expect(assetSearch.makeThumbUrl).toBeDefined()
  }));

  // Testvalues AssetFiltersService methodsa used in search
  fit('AssetFilterService Filter methods are defined', inject([filterNames, filtersAvailable], () => {
    console.log('Filter Names: ', filterNames)
    console.log('Filters Available: ', filtersAvailable)
    expect(filterNames).toBeDefined()
    expect(filtersAvailable).toBeDefined()
  }));

  // Test AssetSearchService.search method
   /**
   * Search assets service
   * @param keyword       String to search for.
   * @param filters       Array of filter objects (with filterGroup and filterValue properties)
   * @param sortIndex     An integer representing a type of sort.
   * @param dateFacet     Object with the dateFacet values
   * @returns       Returns an object with the properties: thumbnails, count, altKey, classificationFacets, geographyFacets, minDate, maxDate, collTypeFacets, dateFacets
   */

  it('calls basic unfiltered or sorted search method', inject([AssetSearchService], (assetSearch: AssetSearchService) => {
    let req = this.mockSearchRequest
    expect(assetSearch.search(this.mockSearchOptions, "", 0)).toBeDefined()
  }));

});
