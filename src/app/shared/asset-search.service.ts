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
    // let dateFacet = this._filters.getAvailable()['dateObj'];

    // if (dateFacet.modified) {
    //   earliestDate = dateFacet.earliest.date;
    //   earliestDate = (dateFacet.earliest.era == 'BCE') ? (parseInt(earliestDate) * -1).toString() : earliestDate;

    //   latestDate = dateFacet.latest.date;
    //   latestDate = (dateFacet.latest.era == 'BCE') ? (parseInt(latestDate) * -1).toString() : latestDate;
    // }
    let filterArray = []
    
    for (var i = 0; i < filters.length; i++) { // Applied filters
      
      
      if ( ['collTypes', 'currentPage', 'pageSize', 'sort'].indexOf(filters[i].filterGroup) > -1) { 
        // Collection Types and page info
        // do nothing
        // colTypeIds = filters[i].filterValue;
      } else {
        for (let j = 0; j < filters[i].filterValue.length; j++) {
          filterArray.push(filters[i].filterValue[j])
        }
        // if (filters[i].filterValue && filters[i].filterValue.length > 0) {
        //   filterArray.push(filters[i].filterValue)
        // }
      }
      // if (filters[i].filterGroup === 'classification') { // Classification
      //   if (classificationIds != '') {
      //     classificationIds += ',';
      //   }
      //   classificationIds += filters[i].filterValue;
      // }
      // if (filters[i].filterGroup === 'geography') { // Geography
      //   if (geographyIds != '') {
      //     geographyIds += ',';
      //   }
      //   geographyIds += filters[i].filterValue;
      // }
    }

    let query = {
      "limit": urlParams.pageSize,
      "start": (urlParams.currentPage - 1) * urlParams.pageSize,
      "content_types": [
        "art"
      ],
    //   "facet_fields": [
    //       "artclassification"
    //   ],
        // "ms_facet_fields": [
        //     {
        //     "field": "artclassification",
        //     "efq": []
        //     }
        // ],
    //  "sort": "agent_str",
    //   "sortorder": "desc"
      // Add fuzzy operator
      "query": keyword + "~0.8",
      "facet_fields" :
      [
        {
          "name" : "collectiontypes",
          "mincount" : 1,
          "limit" : 15
        },
        {
          "name" : "artcollectiontitle_str",
          "mincount" : 1,
          "limit" : 15
        },
        // Limited to 16 classifications (based on the fact that Artstor has 16 classifications)
        {
          "name" : "artclassification_str",
          "mincount" : 1,
          "limit" : 16
        }
        
      ],
      "filter_query" : filterArray
    };
    

    return this.http.post(this._auth.getSearchUrl(), query, options);
  }
}
