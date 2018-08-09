/**
 * Assets service [DEPRECATED, do not add new functions/properties]
 * - Search calls should be moved to asset-search.service as we implement Solr
 */
import { Injectable } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Observable } from 'rxjs'

// Project Dependencies
import { MetadataRes } from './datatypes/asset.interface'

@Injectable()
export class MetadataService {

    /** Default Headers for this service */
    // ... Set content type to JSON
    private header = new HttpHeaders().set('Content-Type', 'application/json')
    private defaultOptions = { headers: this.header, withCredentials: true  }
    
    constructor(
        private http: HttpClient
    ) {
        
    }


    /**
     * Get metadata for an Asset
     * @param assetId string Asset or object ID
     */
    public getMetadata(assetId: string, groupId?: string): Observable<MetadataRes> {
        let url = API_URL + '/api/v1/metadata?legacy=false&object_ids=' + assetId
        if (groupId){
            // Groups service modifies certain access rights for shared assets
            url = API_URL + '/api/v1/group/'+ groupId +'/metadata?object_ids=' + assetId
        }
        return this.http.get<MetadataRes>(url,  this.defaultOptions)
    }
}
