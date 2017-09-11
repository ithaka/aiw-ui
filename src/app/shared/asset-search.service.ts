/**
 * BETA
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

@Injectable()
export class AssetSearchService {

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
    private _auth: AuthService
  ) {}

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
        {
          "name" : "collectiontypes",
          "mincount" : 1,
          "limit" : 10
        },
        // Limited to 16 classifications (based on the fact that Artstor has 16 classifications)
        {
          "name" : "artclassification_str",
          "mincount" : 1,
          "limit" : 16
        },
        {
          "name" : "artcollectiontitle_str",
          "mincount" : 1,
          "limit" : 100
        }
      ],
    };
    
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
    console.log("Running Solr Search...")
    let keyword = term;
    let options = new RequestOptions({
      withCredentials: true
    });
    let startIndex = ((urlParams.currentPage - 1) * urlParams.pageSize) + 1;
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

    if (dateFacet.modified) {
      earliestDate = dateFacet.earliest.date;
      earliestDate = (dateFacet.earliest.era == 'BCE') ? (parseInt(earliestDate) * -1).toString() : earliestDate.toString();

      latestDate = dateFacet.latest.date;
      latestDate = (dateFacet.latest.era == 'BCE') ? (parseInt(latestDate) * -1).toString() : latestDate.toString();
    }
    let filterArray = []

    let query = {
      "limit": urlParams.pageSize,
      "start": (urlParams.currentPage - 1) * urlParams.pageSize,
      "content_types": [
        "art"
      ],
      "startdate" : earliestDate,
      "enddate" : latestDate,
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
        {
          "name" : "collectiontypes",
          "mincount" : 1,
          "limit" : 15
        },
        // Limited to 16 classifications (based on the fact that Artstor has 16 classifications)
        {
          "name" : "artclassification_str",
          "mincount" : 1,
          "limit" : 16
        },
        {
          "name" : "artcollectiontitle_str",
          "mincount" : 1,
          "limit" : 15
        }
      ],
    };
    
    for (var i = 0; i < filters.length; i++) { // Applied filters
      
      
      if ( ['collTypes', 'currentPage', 'pageSize', 'sort', 'startDate', 'endDate'].indexOf(filters[i].filterGroup) > -1) { 
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
          filterArray.push(filters[i].filterValue[j])
        }
      }
    }
    
    query["filter_query"] = filterArray

    if (sortIndex) {
      query["sortorder"] = "desc"
 
      // if(sortIndex == '0'){
      //   sort = 'Relevance';
      // } else 
      if (sortIndex == '1'){
        query["sort"] = 'name_str';
      } else if(sortIndex == '2'){
        query["sort"] = 'agent_str';
      } else if(sortIndex == '3'){
        query["sort"] = 'yearend';
      }
    }
    

    return this.http.post(this._auth.getSearchUrl(), query, options);
  }
}
