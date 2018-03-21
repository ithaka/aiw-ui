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

   public filterFields: { name: string, value: string, description?: string }[] = [
    { name: "In any field", value: "", description: "ADVANCED_SEARCH_MODAL.FIELDS.ANY" },
    { name: "Creator", value: "artcreator", description: "ADVANCED_SEARCH_MODAL.FIELDS.CREATOR" },
    { name: "Title", value: "arttitle", description: "ADVANCED_SEARCH_MODAL.FIELDS.TITLE" },
    { name: "Location", value: "artlocation", description: "ADVANCED_SEARCH_MODAL.FIELDS.LOCATION" },
    { name: "Repository", value: "artcurrentrepository", description: "ADVANCED_SEARCH_MODAL.FIELDS.REPOSITORY" },
    { name: "Subject", value: "artsubject", description: "ADVANCED_SEARCH_MODAL.FIELDS.SUBJECT" },
    { name: "Material", value: "artmaterial", description: "ADVANCED_SEARCH_MODAL.FIELDS.MATERIAL" },
    { name: "Style or Period", value: "artstyleperiod", description: "ADVANCED_SEARCH_MODAL.FIELDS.STYLE_PERIOD" },
    { name: "Work Type", value: "artworktype", description: "ADVANCED_SEARCH_MODAL.FIELDS.WORK_TYPE" },
    { name: "Culture", value: "artculture", description: "ADVANCED_SEARCH_MODAL.FIELDS.CULTURE" },
    { name: "Technique", value: "arttechnique", description: "ADVANCED_SEARCH_MODAL.FIELDS.TECHNIQUE" },
    { name: "Number", value: "artidnumber", description: "ADVANCED_SEARCH_MODAL.FIELDS.NUMBER" },
    { name: "SSID", value: "ssid", description: "ADVANCED_SEARCH_MODAL.FIELDS.SSID" }
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
  * Download an Asset View blob file from tilemap service
  * @param url - Generated tilemap view url
  */
  public downloadViewBlob(url: string): Observable<any> {
    return this.http.get(url, { 
        responseType: 'blob'
    })
    .map(blob => {
        return blob
    })
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
  public search(options: SearchOptions, keyword: string, sortIndex): Observable<SearchResponse> {
    let startIndex = ((options.page - 1) * options.size) + 1;
    let thumbSize = 0;
    let type = 6;
    let colTypeIds = '';
    let collIds = encodeURIComponent(options['coll']);
    let classificationIds = '';
    let geographyIds = '';
    let institutionalTypeFilter: boolean = false

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

    let pageSize: number = options.size
    const START_INDEX: number = (options.page - 1) * pageSize,
      MAX_RESULTS_COUNT: number = 1500

    // final page may not contain exactly 24, 48, or 72 results, so get the exact ammount for the final page
    if ((START_INDEX + pageSize) > MAX_RESULTS_COUNT) {
      pageSize = MAX_RESULTS_COUNT - START_INDEX - 1 // minus 1 because pagination for search starts at 0
      // Don't let pageSize drop below 0, Solr will actually return assets!
      if (pageSize < 0) {
        pageSize = options.size
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

    // Loop through applied filters
    for (var i = 0; i < filters.length; i++) {
      let currentFilter = filters[i]

      // for these values, do nothing
      if ( ['collTypes', 'page', 'size', 'sort', 'startDate', 'endDate'].indexOf(currentFilter.filterGroup) > -1) {

      } else if (currentFilter.filterGroup == 'geography') {
        for (let j = 0; j < currentFilter.filterValue.length; j++) {
          if (!query['hier_facet_fields2'][0]['efq']) {
            query['hier_facet_fields2'][0]['efq'] = [currentFilter.filterValue[j]]
          } else {
            query['hier_facet_fields2'][0]['efq'].push(currentFilter.filterValue[j])
          }
        }
      } else {
        for (let j = 0; j < currentFilter.filterValue.length; j++) {
          let filterValue = currentFilter.filterValue[j]
          /**
           * In case of Inst. colType filter, also use the contributing inst. ID to filter
           */
          if( (currentFilter.filterGroup === 'collectiontypes') && (filterValue === 2 || filterValue === 4) ){
            institutionalTypeFilter = true
            filterArray.push('contributinginstitutionid:\"' + this._auth.getUser().institutionId.toString() + '\"')
          }
          
          // Push filter queries into the array
          let filterValueArray = filterValue.toString().trim().split('|')
          for( let filterVal of filterValueArray){
            filterArray.push(currentFilter.filterGroup + ':\"' + filterVal + '\"')
          }
        }
      }
    }

    if(options.colId || options['coll']){
      let colId = '';
      if( options['coll'] ){
        colId = options['coll'];
      }
      else if ( options.colId ){
        colId = options.colId;
      }

      filterArray.push("collections:\"" + colId + "\"");
    }

    if(options.collections){
      let colsArray = options.collections.toString().trim().split(',');
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
      if (institutionalTypeFilter && res.facets) {
        for (let i = 0; i < res.facets.length; i++) {
          if (res.facets[i].name == 'collectiontypes') {
            // Push the fake Institutional collection type facet only if its not already returned in the response
            if (res.facets[i].values.filter(e => e.name === "2").length === 0) {
              res.facets[i].values.push({
                name: "2", 
                fq: "collectiontypes:(\"2\")",
                count: null,
                efq: null
              })
            }
          }
        }
      }
      this.latestSearchRequestId = res.requestId
      return res
    })
  }

  /**
   * 
   * @param assetId The id of the desired asset
   */
  public getAssetById(assetId: string): Observable<SearchAsset> {
    let assetQuery: SearchRequest = {
      query: assetId,
      content_types: ["art"]
    }

    return this.http.post<SearchResponse>(
      this._auth.getSearchUrl(),
      assetQuery,
      { withCredentials: true }
    )
    .map((res) => {
      // search through results and make sure the id's match
      let desiredAsset: SearchAsset = res.results.find((asset) => {
        return asset.artstorid === assetId
      })

      if (desiredAsset) {
        return desiredAsset
      } else {
        throw new Error('No results found for the requested id')
      }
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
  results: SearchAsset[]
  total: number // total number of assets returned
  hierarchies2: HierarchicalFilter
}

interface SearchAsset {
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
  limit?: number
  start?: number
  content_types: string[]
  query: string
  facet_fields?: {
    name: string
    mincount: number
    limit: number
  }[]
  hier_facet_fields2?: {
    field: string
    hierarchy: string
    look_ahead: number
    look_behind: number
    d_look_ahead: number
  }[]
  filter_query?: string[]
  sortorder?: string
  sort?: string
}

interface SearchOptions {
  page?: number
  size?: number
  colId?: string
  collections?: string
}