/**
 * New Search Service
 */
import {
  Http,
  RequestOptions
} from '@angular/http';
import {
  Injectable
} from '@angular/core';

// Project Dependencies
import {
  AssetFiltersService
} from '../asset-filters/asset-filters.service';
import { AuthService } from './';
import { AppConfig } from '../app.service';

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
    ];

  constructor(
    private http: Http,
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

    let options = new RequestOptions({
      withCredentials: true
    });

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
        {
          "name" : "artclassification_str",
          "mincount" : 1,
          "limit" : 16
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

    return this.http.post(this._auth.getSearchUrl(), query, options)
      .map(res => {
        return res.json ? res.json() : {}
      })
  }

  /**
   * Search assets service
   * @param term          String to search for.
   * @param filters       Array of filter objects (with filterGroup and filterValue properties)
   * @param sortIndex     An integer representing a type of sort.
   * @param dateFacet     Object with the dateFacet values
   * @returns       Returns an object with the properties: thumbnails, count, altKey, classificationFacets, geographyFacets, minDate, maxDate, collTypeFacets, dateFacets
   */
  public search(urlParams: any, term: string, sortIndex) {
    let keyword = term;
    let options = new RequestOptions({
      withCredentials: true
    });
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

    let pageSize = urlParams.size
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

    let query = {
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
        {
          "name" : "artclassification_str",
          "mincount" : 1,
          "limit" : 16
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
          let filterValueArray = filters[i].filterValue[j].toString().trim().split(',')
          for(let filter of filterValueArray){ // Push each filter value seperately in the filterArray (for multiple filter selection within the same filterGroup)
            filterArray.push(filters[i].filterGroup + ':\"' + filter + '\"')
          }          
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

    query["filter_query"] = filterArray

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


    return this.http.post(this._auth.getSearchUrl(), query, options);
  }
}
