/**
 * New Search Service
 */
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http'
import { Injectable } from '@angular/core'

// Project Dependencies
import {
  AssetFiltersService
} from '../asset-filters/asset-filters.service'
import { AuthService } from './auth.service'
import { AppConfig } from '../app.service'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { APP_CONST } from '../app.constants'
import { AssetThumbnail } from 'datatypes'
import { ThumbnailService } from 'app/_services/thumbnail.service' // specific to avoid circular dependency
@Injectable()
export class AssetSearchService {

  showCollectionType: boolean = false

  public filterFields: { name: string, value: string, description?: string }[] = [
    { name: 'In any field', value: '', description: 'ADVANCED_SEARCH_MODAL.FIELDS.ANY' },
    { name: 'Creator', value: 'artcreator', description: 'ADVANCED_SEARCH_MODAL.FIELDS.CREATOR' },
    { name: 'Title', value: 'arttitle', description: 'ADVANCED_SEARCH_MODAL.FIELDS.TITLE' },
    { name: 'Location', value: 'artlocation', description: 'ADVANCED_SEARCH_MODAL.FIELDS.LOCATION' },
    { name: 'Repository', value: 'artcurrentrepository', description: 'ADVANCED_SEARCH_MODAL.FIELDS.REPOSITORY' },
    { name: 'Subject', value: 'artsubject', description: 'ADVANCED_SEARCH_MODAL.FIELDS.SUBJECT' },
    { name: 'Material', value: 'artmaterial', description: 'ADVANCED_SEARCH_MODAL.FIELDS.MATERIAL' },
    { name: 'Style or Period', value: 'artstyleperiod', description: 'ADVANCED_SEARCH_MODAL.FIELDS.STYLE_PERIOD' },
    { name: 'Work Type', value: 'artworktype', description: 'ADVANCED_SEARCH_MODAL.FIELDS.WORK_TYPE' },
    { name: 'Culture', value: 'artculture', description: 'ADVANCED_SEARCH_MODAL.FIELDS.CULTURE' },
    { name: 'Technique', value: 'arttechnique', description: 'ADVANCED_SEARCH_MODAL.FIELDS.TECHNIQUE' },
    { name: 'Number', value: 'artidnumber', description: 'ADVANCED_SEARCH_MODAL.FIELDS.NUMBER' },
    { name: 'SSID', value: 'ssid', description: 'ADVANCED_SEARCH_MODAL.FIELDS.SSID' },
    { name: 'Repository ID', value: 'artcurrentrepositoryidnumber', description: 'ADVANCED_SEARCH_MODAL.FIELDS.REPO_ID' }
  ]

  public latestSearchRequestId: string
  public ab_segments: any = new Map()

  // Used for simplify the code when versioning search
  private contentQueryKey: string
  private filterQueryKey: string

  constructor(
    private _http: HttpClient,
    private _filters: AssetFiltersService,
    private _auth: AuthService,
    private _app: AppConfig,
    private _thumbnail: ThumbnailService
  ) {
    this.showCollectionType = this._app.config.advSearch.showCollectionTypeFacet
  }

  private initQuery(keyword: string, pageSize, startIndex) {
    this.contentQueryKey = 'content_set_flags'
    this.filterQueryKey = 'filter_queries'

    let query = {
      'limit': pageSize,
      'start': startIndex,
      // 'content_types': [
      //   'art'
      // ],
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
      'query': keyword,
      // filter_query: [],
      'hier_facet_fields2': [
        {
          'field': 'hierarchies',
          'hierarchy': 'artstor-geography',
          'look_ahead': 2,
          'look_behind': -10,
          'd_look_ahead': 1
        }
      ],
      'facet_fields':
        [
          // Limited to 16 classifications (based on the fact that Artstor has 16 classifications)
          // + 1 to allow for empty string values crowding out the top 16
          {
            'name': 'artclassification_str',
            'mincount': 1,
            'limit': 20
          },
          // ,
          // {
          //   "name" : "artcollectiontitle_str",
          //   "mincount" : 1,
          //   "limit" : 15
          // }
          {
            "name": "donatinginstitutionids",
            "mincount": 1,
            "limit": 400
          }
        ],
    };
    query[this.contentQueryKey] = ['art'];
    query[this.filterQueryKey] = [];

    return query;
  }

  /**
   * applyFilters
   * Wraps logic for applying filters to search requests.
   * @params are locally scoped to the search method
   */
  public applyFilters(query, institutionalTypeFilter, options, sortIndex, filterOptions) {
    // Loop through applied filters
    for (let i = 0; i < filterOptions.filters.length; i++) {
      let currentFilter = filterOptions.filters[i]
      institutionalTypeFilter = false;
      // for these values, do nothing
      if (['collTypes', 'page', 'size', 'sort', 'startDate', 'endDate'].indexOf(currentFilter.filterGroup) > -1) {

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
          institutionalTypeFilter = false;
          /**
           * In case of Inst. colType filter, ONLY use the contributing inst. ID to filter
           */
          if ((currentFilter.filterGroup === 'collectiontypes') && (filterValue === 2 || filterValue === 4)) {
            institutionalTypeFilter = true;
            filterOptions.filterArray.push('contributinginstitutionid:\"' + this._auth.getUser().institutionId.toString() + '\"')
          }

          // Push filter queries into the array
          if (!institutionalTypeFilter) {
            let filterValueArray = filterValue.toString().trim().split('|')
            for (let filterVal of filterValueArray) {
              filterOptions.filterArray.push(currentFilter.filterGroup + ':\"' + filterVal + '\"')
            }
          }
        }
      }
    }

    if (options.colId || options['coll'] || options.pcolId) {
      let colId = ''
      if (options['coll']) {
        colId = options['coll']
      }
      else if (options.colId) {
        colId = options.colId
      }
      else if (options.pcolId) {
        // Loading Personal OR Private Collection
        colId = options.pcolId
      }

      filterOptions.filterArray.push('collections:"' + colId + '"');
    }

    if (options.collections) {
      let colsArray = options.collections.toString().trim().split(',');
      for (let col of colsArray) { // Push each collection id seperately in the filterArray
        filterOptions.filterArray.push('collections:"' + col + '"');
      }
    }

    query[this.filterQueryKey] = filterOptions.filterArray

    if (filterOptions.dateFacet.modified) {
      filterOptions.earliestDate = filterOptions.dateFacet.earliest.date;
      if (Number.isInteger(filterOptions.earliestDate)) {
        filterOptions.earliestDate = (filterOptions.dateFacet.earliest.era == 'BCE') ? (parseInt(filterOptions.earliestDate) * -1).toString() : filterOptions.earliestDate.toString()
      }

      filterOptions.latestDate = filterOptions.dateFacet.latest.date;
      if (Number.isInteger(filterOptions.latestDate)) {
        filterOptions.latestDate = (filterOptions.dateFacet.latest.era == 'BCE') ? (parseInt(filterOptions.latestDate) * -1).toString() : filterOptions.latestDate.toString()
      }

      query[this.filterQueryKey].push('year:[' + filterOptions.earliestDate + ' TO ' + filterOptions.latestDate + ']')
    }

    if (sortIndex) {
      // Set the sort order to descending for sort by 'Recently Added' else ascending
      if (sortIndex == '4') {
        query['sortorder'] = 'desc'
      } else {
        query['sortorder'] = 'asc'
      }

      if (sortIndex == '1') {
        query['sort'] = 'name_str'
      } else if (sortIndex == '2') {
        query['sort'] = 'agent_str'
      } else if (sortIndex == '3') {
        query[this.filterQueryKey].push('year:[* TO *]', '-year:((0) OR (9999))', 'yearend:[* TO *]', '-yearend:((0) OR (9999))')
        query['sort'] = 'yearend'
      } else if (sortIndex == '4') {
        query['sort'] = 'updatedon_str'
      }

      // For collection pages, if there is no search term, sort by `work_sequence_num`
      if((options['colId'] || options['clusterId']) && !options['term'] && sortIndex === '0') {
        query['sortorder'] = 'asc'
        query['sort'] = 'worksequence_num'
      }
    }
  }

  /**
   * Uses wildcard search to retrieve filters
   */
  public getFacets() {
    this.contentQueryKey = 'content_set_flags'
    this.filterQueryKey = 'filter_queries'
    let query = {
      'limit': 0,
      'start': 1,
      // 'content_types': [
      //   'art'
      // ],
      // "query": "*",
      'hier_facet_fields2': [
        {
          'field': 'hierarchies',
          'hierarchy': 'artstor-geography',
          'look_ahead': 2,
          'look_behind': -10,
          'd_look_ahead': 1
        }
      ],
      'facet_fields':
        [
          // Limited to 16 classifications (based on the fact that Artstor has 16 classifications)
          // + 1 to allow for empty string values crowding out the top 16
          {
            'name': 'artclassification_str',
            'mincount': 1,
            'limit': 30
          }
          // {
          //   "name" : "artcollectiontitle_str",
          //   "mincount" : 1,
          //   "limit" : 100
          // }
        ],
    };
    query[this.contentQueryKey] = ['art'];

    let filterArray = []

    // if not sahara push this facet
    if (this.showCollectionType) {
      query.facet_fields.push({
        'name': 'collectiontypes',
        'mincount': 1,
        'limit': 10
      })
    }

    /**
     * Check for WLVs Institution filter
     * - WLVs filter by contributing institution id
     */
    let institutionFilters: number[] = this._app.config.contributingInstFilters
    for (let i = 0; i < institutionFilters.length; i++) {
      filterArray.push('contributinginstitutionid:' + institutionFilters[i])
    }

    query[this.filterQueryKey] = filterArray

    return this._http.post(this._auth.getSearchUrl(), query, { withCredentials: true })
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
    // Construct query keyword based on options
    if (options.hasOwnProperty('clusterId') && options['clusterId'] !== '') {
        keyword = 'clusterid:(' + options['clusterId'] + ')'
    } else if (options.hasOwnProperty('objectId') && options['objectId'] !== '') {
        keyword = 'frequentlygroupedwith:(' + options['objectId'] + ')'
    } else if (options.hasOwnProperty('pcolId') && options['pcolId'] !== '') {
        if (options['pcolId'] === '37436') {
            let user = this._auth.getUser()
            keyword += ' personalcollectionowner:(' + user['baseProfileId']  + ')'
        }
    } else if (options.hasOwnProperty('term')) {;
        if (options.hasOwnProperty('catId')  && options['catId'] !== '') {
            keyword += ' categoryid:' + options['catId']
        }
    }

    let thumbSize = 0;
    let type = 6;
    let colTypeIds = '';
    let collIds = encodeURIComponent(options['coll']);
    let classificationIds = '';
    let geographyIds = '';
    let institutionalTypeFilter: boolean = false

    // Shared Variables passed to applyFilters
    let filterOptions = {
      filters: this._filters.getApplied(),
      // To-do: break dateObj out of available filters
      dateFacet: this._filters.getAvailable()['dateObj'],
      filterArray: [],
      earliestDate: '',
      latestDate: '',
    }

    /**
     * Check for WLVs Institution filter
     * - WLVs filter by contributing institution id
     */
    let institutionFilters: number[] = this._app.config.contributingInstFilters
    for (let i = 0; i < institutionFilters.length; i++) {
      filterOptions.filterArray.push('contributinginstitutionid:' + institutionFilters[i])
    }

    let pageSize: number = options.size
    const START_INDEX: number = (options.page - 1) * pageSize,
      MAX_RESULTS_COUNT: number = APP_CONST.MAX_RESULTS

    // final page may not contain exactly 24, 48, or 72 results, so get the exact ammount for the final page
    if ((START_INDEX + pageSize) > MAX_RESULTS_COUNT) {
      pageSize = MAX_RESULTS_COUNT - START_INDEX - 1 // minus 1 because pagination for search starts at 0
      // Don't let pageSize drop below 0, Solr will actually return assets!
      if (pageSize < 0) {
        pageSize = options.size
      }
    }

    let query = this.initQuery(keyword, pageSize, START_INDEX)

    if (this.showCollectionType) {
      query.facet_fields.push({
        'name': 'collectiontypes',
        'mincount': 1,
        'limit': 15
      })
    }

    this.applyFilters(query, institutionalTypeFilter, options, sortIndex, filterOptions)

    return this._http.post<RawSearchResponse>(
      this._auth.getSearchUrl(),
      query,
      { withCredentials: true }
    ).pipe(
      map((res) => {
        if (institutionalTypeFilter && res.facets) {
          for (let i = 0; i < res.facets.length; i++) {
            if (res.facets[i].name == 'collectiontypes') {
              // Push the fake Institutional collection type facet only if its not already returned in the response
              if (res.facets[i].values.filter(e => e.name === '2').length === 0) {
                res.facets[i].values.push({
                  name: '2',
                  fq: 'collectiontypes:("2")',
                  count: null,
                  efq: null
                })
              }
            }
          }
        }

        // media comes as a json string, so we'll parse it into an object for each result
        let cleanedResults: AssetThumbnail[] = res.results.map((item) => {
          return this._thumbnail.searchAssetToThumbnail(item)
        })

        // Build a mapping between the artstorid and ab_segment for logging. Reinitialize on each request.
        this.ab_segments = new Map();
        res.results.forEach((result) => { this.ab_segments.set(result['artstorid'], result['ab_segment'])})

        // create the cleaned response to pass to caller
        let searchResponse: SearchResponse = Object.assign({}, res, { results: cleanedResults })

        this.latestSearchRequestId = res.requestId
        return searchResponse
      }))
  }

  /**
   * Search jstor index for secondary resources
   * @param searchTerm   String containing asset title with no quote AND if/then statement for subject and work type (prioritizing subject as first, if present, and then work type, if subject isn't present, but work type is)
   * @returns       Returns a response object from jstor search containing results
   */
  public searchJstor(searchTerm: string): Observable<any> {
    let query = {
      'content_types': [],
      'additional_fields': ['rectype', 'raw_type', 'htopic_st'],
      'hier_facet_fields': [
        {
          'maxdepth': 10,
          'mincount': 1,
          'name': 'htopic_st',
          'alias': 'thesaurus1',
          'limit': 500
        }
      ],
      'limit': 25,
      'result_includes': [],
      'hier_facet_fields2': [],
      'ms_facet_fields': [],
      'query': searchTerm,
      'facet_fields': [
        {
          'name': 'disc',
          'mincount': 1,
          'limit': 10
        }
      ]
    }

    return this._http.post<SearchResponse>(
      'http://search-service.apps.test.cirrostratus.org/browse/',
      query,
      { withCredentials: true }
    )
  }

  /**
   *
   * @param assetId The id of the desired asset
   */
  public getAssetById(assetId: string, ssid?: boolean): Observable<AssetThumbnail> {
    this.contentQueryKey = 'content_set_flags'

    let assetQuery: SearchRequest = {
      'query': ssid ? 'ssid:' + assetId : assetId,
      'limit': 1, // Required by search
      [this.contentQueryKey]: ['art']
    }

    return this._http.post<SearchResponse>(
      this._auth.getSearchUrl(),
      assetQuery,
      { withCredentials: true }
    ).pipe(
      map((res) => {
        // search through results and make sure the id's match
        let desiredAsset: any = res.results.find((asset) => {
          if(ssid) {
            // extract ssid from doi field value
            return asset.doi.split('/')[1].replace('artstor.', '') === assetId
          } else {
            return asset.artstorid === assetId
          }
        })

        if (desiredAsset) {
          return this._thumbnail.searchAssetToThumbnail(desiredAsset)
        } else {
          throw new Error('No results found for the requested id')
        }
      }))
  }
}

// the cleaned response object which is returned by the service
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
  results: RawSearchAsset[]
  total: number // total number of assets returned
  hierarchies2: HierarchicalFilter
}

// the response directly from search
export interface RawSearchResponse {
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
  results: RawSearchAsset[]
  total: number // total number of assets returned
  hierarchies2: HierarchicalFilter
}

/**
 * Raw thumbnail/asset object returned by:
 * Search Service (Team Sycamore/Search)
 */
export interface RawSearchAsset {
  agent: string // creator of the piece
  artstorid: string // the correct id to reference when searching for artstor assets
  clusterid: string // id of the cluser the asset exists in, if any
  collections: string[] // array of collections this asset exists under
  collectiontypenameid: string[]
  collectiontypes: number[] // all of the collection types this asset fits
  compound_media: string // json as string
  contributinginstitutionid: number // which institution added the asset
  date: string // a string entered by the user, not an actually useful date other than display
  doi: string // ex: "10.2307/artstor.16515779"
  frequentlygroupedwith: string[] // array of other asset ids this image is grouped with
  iap: boolean // do we support Images for Academic Publishing for the asset
  // id: string // the id used by the SOLR cluster, which is not reliable, therefore it's left commented out
  media: string // json as string
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

export interface SearchAsset {
  agent: string // creator of the piece
  artstorid: string // the correct id to reference when searching for artstor assets
  clusterid: string // id of the cluser the asset exists in, if any
  collections: string[] // array of collections this asset exists under
  collectiontypenameid: string[]
  collectiontypes: number[] // all of the collection types this asset fits
  compound_media?: string // stringified of compound media object
  compound_media_json?: {
     // Client side added: parsed json of compound media
     types?: string[]
     objects?: any[]
  }
  contributinginstitutionid: number // which institution added the asset
  date: string // a string entered by the user, not an actually useful date other than display
  doi: string // ex: "10.2307/artstor.16515779"
  ssid: string
  frequentlygroupedwith: string[] // array of other asset ids this image is grouped with
  iap: boolean // do we support Images for Academic Publishing for the asset
  // id: string // the id used by the SOLR cluster, which is not reliable, therefore it's left commented out
  media: MediaObject // dictionary of media properties
  name: string // the asset's name
  partofcluster: boolean
  tokens: string[]
  type: string // going to be "art" for all artstor assets
  thumbnailUrls: string[] // the index here is the size of the thumbnail
  updatedon: Date // date the asset was last updated in Forum
  workid: string // id of the work record in Forum that the asset belongs to
  year: number // the year the asset is marked as being created
  yearbegin: number // beginning of date range the asset is thought to have been created in
  yearend: number // end of date range the asset is thought to have been created in
}

export interface HierarchicalFilter {
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

export interface MediaObject {
  format: string
  thumbnailSizeOnePath: string
  width: number
  sizeInBytes: number
  downloadSize: number
  type: string
  icc_profile_location: string
  thumbnailSizeZeroPath: string
  filename: string
  lps: string
  iiif: string
  storId: string
  adlObjectType: number
  height: number
}

export interface SearchRequest {
  limit?: number
  start?: number
  content_types?: string[] // made to optional because under search3 we use content_set_flags instead of content_types
  content_set_flags?: string[]
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
  filter_queries?: string[]
  sortorder?: string
  sort?: string
}

export interface SearchOptions {
  page?: number
  size?: number
  colId?: string
  collections?: string
  pcolId?: string
}
