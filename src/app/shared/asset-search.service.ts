/**
 * New Search Service
 */
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http'
import { Injectable } from '@angular/core'

// Project Dependencies
import {
  AssetFiltersService
} from '../asset-filters/asset-filters.service'
import { AuthService } from './'
import { AppConfig } from '../app.service'
import { Observable } from 'rxjs/Observable'

@Injectable()
export class AssetSearchService {

  showCollectionType: boolean = false

   public filterFields = [
    {name: "In any field", value: "*"},
    {name: "Creator", value: "artcreator" },
    {name: "Title", value: "arttitle" },
    {name: "Location", value: "artlocation" },
    {name: "Repository", value: "artrepository" },
    {name: "Subject", value: "artsubject" },
    {name: "Material", value: "artmaterial" },
    {name: "Style or Period", value: "artstyleperiod" },
    {name: "Work Type", value: "artworktype" },
    {name: "Culture", value: "artculture" },
    {name: "Technique", value: "arttechnique" },
    {name: "Number", value: "artidnumber" }
  ]

  public latestSearchRequestId: string

  constructor(
    private http: HttpClient,
    private _filters: AssetFiltersService,
    private _auth: AuthService,
    private _app: AppConfig
  ) {
    this.showCollectionType = this._app.config.advSearch.showCollectionTypeFacet
  }

  /**
   * Uses wildcard search to retrieve filters
   */
  public getFacets() {

    let query = {
      "limit": 0,
      "start": 1,
      "content_types": [
        "art"
      ],
      // "query": "*",
      "hier_facet_fields2": [
      {
        "field": "hierarchies",
        "hierarchy": "artstor-geography",
        "look_ahead": 2,
        "look_behind": -10,
        "d_look_ahead": 1
      }
    ],
      "facet_fields" :
      [
        // Limited to 16 classifications (based on the fact that Artstor has 16 classifications)
        // + 1 to allow for empty string values crowding out the top 16 
        {
          "name" : "artclassification_str",
          "mincount" : 1,
          "limit" : 17
        }
        // {
        //   "name" : "artcollectiontitle_str",
        //   "mincount" : 1,
        //   "limit" : 100
        // }
      ],
    };

    let filterArray = []

    // if not sahara push this facet
    if (this.showCollectionType) {
      query.facet_fields.push({
        "name" : "collectiontypes",
        "mincount" : 1,
        "limit" : 10
      })
    }

    /**
     * Check for WLVs Institution filter
     * - WLVs filter by contributing institution id
     */
    let institutionFilters: number[] = this._app.config.contributingInstFilters
    for (let i = 0; i < institutionFilters.length; i++) {
      filterArray.push("contributinginstitutionid:" + institutionFilters[i])
    }

    query["filter_query"] = filterArray

    return this.http.post(this._auth.getSearchUrl(), query, { withCredentials: true })
  }

  /**
   * Search assets service
   * @param keyword          String to search for.
   * @param filters       Array of filter objects (with filterGroup and filterValue properties)
   * @param sortIndex     An integer representing a type of sort.
   * @param dateFacet     Object with the dateFacet values
   * @returns       Returns an object with the properties: thumbnails, count, altKey, classificationFacets, geographyFacets, minDate, maxDate, collTypeFacets, dateFacets
   */
  public search(urlParams: any, keyword: string, sortIndex): Observable<SearchResponse> {
    let startIndex = ((urlParams.page - 1) * urlParams.size) + 1;
    let thumbSize = 0;
    let type = 6;
    let colTypeIds = '';
    let collIds = encodeURIComponent(urlParams['coll']);
    let classificationIds = '';
    let geographyIds = '';

    let earliestDate = '';
    let latestDate = '';

    let filters = this._filters.getApplied();
    // To-do: break dateObj out of available filters
    let dateFacet = this._filters.getAvailable()['dateObj'];
    let filterArray = []

    /**
     * Check for WLVs Institution filter
     * - WLVs filter by contributing institution id
     */
    let institutionFilters: number[] = this._app.config.contributingInstFilters
    for (let i = 0; i < institutionFilters.length; i++) {
      filterArray.push("contributinginstitutionid:" + institutionFilters[i])
    }

    let pageSize: number = urlParams.size
    const START_INDEX: number = (urlParams.page - 1) * pageSize,
      MAX_RESULTS_COUNT: number = 1500

    // final page may not contain exactly 24, 48, or 72 results, so get the exact ammount for the final page
    if ((START_INDEX + pageSize) > MAX_RESULTS_COUNT) {
      pageSize = MAX_RESULTS_COUNT - START_INDEX - 1 // minus 1 because pagination for search starts at 0
      // Don't let pageSize drop below 0, Solr will actually return assets!
      if (pageSize < 0) {
        pageSize = urlParams.size
      }
    }

    let query: any = { // haven't added the SearchRequest type yet because I don't know how to deal with the TS error I'm getting - can't even see the whole thing
      "limit": pageSize,
      "start": START_INDEX,
      "content_types": [
        "art"
      ],
      // "startdate" : earliestDate,
      // "enddate" : latestDate,
    //   "facet_fields": [
    //       "artclassification"
    //   ],
        // "ms_facet_fields": [
        //     {
        //     "field": "artclassification",
        //     "efq": []
        //     }
        // ],
      // Add fuzzy operator
      "query": keyword,
      // Fuzzy searches are expensive, avoid by request of Archie
      // + "~0.8",
      "hier_facet_fields2": [
      {
        "field": "hierarchies",
        "hierarchy": "artstor-geography",
        "look_ahead": 2,
        "look_behind": -10,
        "d_look_ahead": 1
      }
    ],
      "facet_fields" :
      [
        // Limited to 16 classifications (based on the fact that Artstor has 16 classifications)
        // + 1 to allow for empty string values crowding out the top 16 
        {
          "name" : "artclassification_str",
          "mincount" : 1,
          "limit" : 17
        }
        // ,
        // {
        //   "name" : "artcollectiontitle_str",
        //   "mincount" : 1,
        //   "limit" : 15
        // }
      ],
    };

    if (this.showCollectionType) {
      query.facet_fields.push({
        "name" : "collectiontypes",
        "mincount" : 1,
        "limit" : 15
      })
    }

    for (var i = 0; i < filters.length; i++) { // Applied filters


      if ( ['collTypes', 'page', 'size', 'sort', 'startDate', 'endDate'].indexOf(filters[i].filterGroup) > -1) {
        // Collection Types and page info
        // do nothing
      } else if (filters[i].filterGroup == 'geography') {
        for (let j = 0; j < filters[i].filterValue.length; j++) {
          if (!query['hier_facet_fields2'][0]['efq']) {
            query['hier_facet_fields2'][0]['efq'] = [filters[i].filterValue[j]]
          } else {
            query['hier_facet_fields2'][0]['efq'].push(filters[i].filterValue[j])
          }
        }
      } else {
        for (let j = 0; j < filters[i].filterValue.length; j++) {
          let filterValue = filters[i].filterValue[j]
          /**
           * In case of Inst. colType filter, also use the contributing inst. ID to filter
           */
          if( (filters[i].filterGroup === 'collectiontypes') && (filterValue === 2 || filterValue === 4) ){
            filterArray.push('contributinginstitutionid:\"' + this._auth.getUser().institutionId.toString() + '\"')
          }
          // Push filter queries into the array
          filterArray.push(filters[i].filterGroup + ':\"' + filterValue + '\"')
        }
      }
    }

    if(urlParams.colId || urlParams['coll']){
      let colId = '';
      if( urlParams['coll'] ){
        colId = urlParams['coll'];
      }
      else if ( urlParams.colId ){
        colId = urlParams.colId;
      }

      filterArray.push("collections:\"" + colId + "\"");
    }

    if(urlParams.collections){
      let colsArray = urlParams.collections.toString().trim().split(',');
      for(let col of colsArray){ // Push each collection id seperately in the filterArray
        filterArray.push("collections:\"" + col + "\"");
      }
    }

    query.filter_query = filterArray

    if (dateFacet.modified) {
      earliestDate = dateFacet.earliest.date;
      earliestDate = (dateFacet.earliest.era == 'BCE') ? (parseInt(earliestDate) * -1).toString() : earliestDate.toString();

      latestDate = dateFacet.latest.date;
      latestDate = (dateFacet.latest.era == 'BCE') ? (parseInt(latestDate) * -1).toString() : latestDate.toString();

      query["filter_query"].push( "year:[" + earliestDate + " TO " + latestDate + "]")
    }

    if (sortIndex) {
      // Set the sort order to descending for sort by 'Recently Added' else ascending
      if (sortIndex == '4'){
        query["sortorder"] = "desc"
      } else{
        query["sortorder"] = "asc"
      }

      if (sortIndex == '1'){
        query["sort"] = 'name_str'
      } else if(sortIndex == '2'){
        query["sort"] = 'agent_str'
      } else if(sortIndex == '3'){
        query["sort"] = 'yearend'
      } else if(sortIndex == '4'){
        query["sort"] = 'updatedon_str'
      }
    }


    return this.http.post<SearchResponse>(
      this._auth.getSearchUrl(),
      query,
      { withCredentials: true }
    )
    .map((res) => {
      this.latestSearchRequestId = res.requestId
      return res
    })
  }
}

export interface SearchResponse {
  facets: {
    name: string
    values: {
      count: number
      efq: string
      fq: string
      name: string
    }[]
  }[]
  bad_request: boolean
  requestId: string
  results: {
    agent: string // creator of the piece
    artstorid: string // the correct id to reference when searching for artstor assets
    clusterid: string // id of the cluser the asset exists in, if any
    collections: string[] // array of collections this asset exists under
    collectiontypenameid: string[]
    collectiontypes: number[] // all of the collection types this asset fits
    contributinginstitutionid: number // which institution added the asset
    date: string // a string entered by the user, not an actually useful date other than display
    doi: string // ex: "10.2307/artstor.16515779"
    frequentlygroupedwith: string[] // array of other asset ids this image is grouped with
    iap: boolean // do we support Images for Academic Publishing for the asset
    // id: string // the id used by the SOLR cluster, which is not reliable, therefore it's left commented out
    media: string // this one is weird because it's a json object encoded as a string
    name: string // the asset's name
    partofcluster: boolean
    tokens: string[]
    type: string // going to be "art" for all artstor assets
    updatedon: Date // date the asset was last updated in Forum
    workid: string // id of the work record in Forum that the asset belongs to
    year: number // the year the asset is marked as being created
    yearbegin: number // beginning of date range the asset is thought to have been created in
    yearend: number // end of date range the asset is thought to have been created in
  }[]
  total: number // total number of assets returned
  hierarchies2: HierarchicalFilter
}

interface HierarchicalFilter {
  [key: string]: {
    children: HierarchicalFilter
    element: {
      count: number
      depth: string
      efq: string
      label: string[]
      selected: boolean
    }
  }
}

interface SearchRequest {
  limit: number
  start: number
  content_types: string[]
  query: string
  facet_fields: {
    name: string
    mincount: number
    limit: number
  }[]
  hier_facet_fields2: {
    field: string
    hierarchy: string
    look_ahead: number
    look_behind: number
    d_look_ahead: number
  }[]
  filter_query: string[]
  sortorder: string
  sort: string
}