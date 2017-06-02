import { Injectable } from '@angular/core';

@Injectable()
export class AssetSearchService {

constructor() { }


private search(term: string, sortIndex) {
        let keyword = term;
        let options = new RequestOptions({ withCredentials: true });
        let startIndex = ((this.urlParams.currentPage - 1) * this.urlParams.pageSize) + 1;
        let thumbSize = 0;
        let type = 6;
        let colTypeIds = '';
        let collIds = encodeURIComponent(this.urlParams['coll']);
        let classificationIds = '';
        let geographyIds = '';

        let earliestDate = '';
        let latestDate = '';

        let filters = this._filters.getApplied(); 
        // To-do: break dateObj out of available filters
        let dateFacet = this._filters.getAvailable()['dateObj'];
        
        if(dateFacet.modified){
            earliestDate = dateFacet.earliest.date;
            earliestDate = ( dateFacet.earliest.era == 'BCE' ) ? ( parseInt(earliestDate) * -1 ).toString() : earliestDate;

            latestDate = dateFacet.latest.date;
            latestDate = ( dateFacet.latest.era == 'BCE' ) ? ( parseInt(latestDate) * -1 ).toString() : latestDate;
        }

        for(var i = 0; i < filters.length; i++){ // Applied filters
            if(filters[i].filterGroup === 'collTypes'){ // Collection Types
                colTypeIds = filters[i].filterValue;
            }
            if(filters[i].filterGroup === 'classification'){ // Classification
                if(classificationIds != ''){
                    classificationIds += ',';
                }
                classificationIds += filters[i].filterValue;
            }
            if(filters[i].filterGroup === 'geography'){ // Geography
                if(geographyIds != ''){
                    geographyIds += ',';
                }
                geographyIds += filters[i].filterValue;
            }
        }
        
        // if (this.newSearch === false) {
        //     return this.http
        //         .get(this._auth.getUrl() + '/search/' + type + '/' + startIndex + '/' + this.urlParams.pageSize + '/' + sortIndex + '?' + 'type=' + type + '&kw=' + keyword + '&origKW=' + keyword + '&geoIds=' + geographyIds + '&clsIds=' + classificationIds + '&collTypes=' + colTypeIds + '&id=' + (collIds.length > 0 ? collIds : 'all') + '&name=All%20Collections&bDate=' + earliestDate + '&eDate=' + latestDate + '&dExact=&order=0&isHistory=false&prGeoId=&tn=1', options);
        // } else {
            let query = {
                "limit" : this.urlParams.pageSize,
                "page" : this.urlParams.currentPage,
                "content_types" : [
                    "art"
                ],
                "query" : "arttitle:'" + keyword + "' OR artcreator:'" + keyword + "'"
            };

            return this.http.post('//search-service.apps.test.cirrostratus.org/browse/', query, options);
        // }
        
    }
}