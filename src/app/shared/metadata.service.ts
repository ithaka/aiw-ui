/**
 * Assets service [DEPRECATED, do not add new functions/properties]
 * - Search calls should be moved to asset-search.service as we implement Solr
 */
import { Injectable } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Observable } from 'rxjs'

// Project Dependencies
import { MetadataResponse } from '../_services/metadata.service'
import { FlagService } from './flag.service'
import { environment } from 'environments/environment';

@Injectable()
export class MetadataService {

    /** Default Headers for this service */
    // ... Set content type to JSON
    private header = new HttpHeaders().set('Content-Type', 'application/json')
    private defaultOptions = { headers: this.header, withCredentials: true  }

    constructor(
        private http: HttpClient,
        private _flags: FlagService
    ) {

    }


    /**
     * Get metadata for an Asset
     * @param assetId string Asset or object ID
     */
    public getMetadata(assetId: string, groupId?: string, legacyOverride?: boolean): Observable<MetadataResponse> {
        let legacyFlag = typeof legacyOverride !== 'undefined' ? legacyOverride : !this._flags.solrMetadata
        let url = environment.API_URL + '/api/v1/metadata?object_ids=' + assetId + "&legacy=" + legacyFlag
        if (groupId){
            // Groups service modifies certain access rights for shared assets
            url = environment.API_URL + '/api/v1/group/' + groupId + '/metadata?object_ids=' + assetId
        }
        return this.http.get<MetadataResponse>(url,  this.defaultOptions)
    }
}
