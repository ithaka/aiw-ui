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

@Injectable()
export class AssetSearchService {

  constructor(
    private http: Http,
    private _filters: AssetFiltersService
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
      
      
      if (filters[i].filterGroup === 'collTypes') { // Collection Types
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
      "query": keyword,
      "facet_fields" :
      [
        {
          "name" : "artcollectiontitle_str",
          "mincount" : 1,
          "limit" : 20
        },
        {
          "name" : "artclassification_str",
          "mincount" : 1,
          "limit" : 20
        }
      ],
      "filter_query" : filterArray
    };
    

    return this.http.post('//search-service.apps.test.cirrostratus.org/browse/', query, options);
  }
}
