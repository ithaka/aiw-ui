import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';

// Project Dependencies
import { AuthService, ImageGroup } from '.';

@Injectable()
export class GroupService {

    private groupUrl: string = '';
    private options: RequestOptions;

    constructor(
        private http: Http,
        private _auth: AuthService
    ) {

        // ' + this._auth.getSubdomain() + '
        // this.groupUrl = '//stagely.artstor.org/api/v1/group';
        this.groupUrl = '//lively.artstor.org/api/v1/group';
        let headers = new Headers({ });

        this.options = new RequestOptions({ headers: headers, withCredentials: true });
    }

    /**
     * Get All Groups
     */
    public getAll(size?: number, pageNo ?: number, tags ?: string[] ): Observable<any> {
        if (!tags) {
            tags = [];
        }
        if (!size) {
            size = 48;
        }
        if (!pageNo) {
            pageNo = 1;
        }

        let tagParam = "";
        tags.forEach( tag => { 
            tagParam += '&tags=' + tag;
        });

        return this.http.get(
            this.groupUrl + "?size=" + size + '&from=' + ( (pageNo - 1) * size) +  tagParam,
        ).map(
            res => {
                let body = res.json();
                return body || { };
            }
        );
    }

     /**
     * Get Individual Group
     */
    public get(groupId: string): Observable<any> {
        return this.http.get(
            this.groupUrl + '/' + groupId
        );
    }
        
    /**
     * Create Group
     */
    public create(group: any): Observable<any> {
        return this.http.post(
            this.groupUrl,
            group
        ).map(
            res => {
                let body = res.json();
                return body || { };
            }
        );
    }

    /**
     * Copy Group
     */
    public copy(igId: string, copygroup: any): Observable<any> {
        return this.http.post(
            this.groupUrl + '/' + igId + '/copy',
            copygroup
        ).map(
            res => {
                let body = res.json();
                return body || { };
            }
        );
    }

    /**
     * Remove Group
     */
    public delete(groupId: string): Observable<any> {
        let headers = new Headers({ 'Accept' : 'application/json' });
        let options = new RequestOptions({ headers: headers });

        return this.http.delete(this.groupUrl + '/' + groupId, options)
            .map(res => <any> res.json());
    }

    /**
     * Update Group. The body sent cannot contain id, insts-with-access or users-with-access
     */
    public update(group: any): Observable<any> {
        let id = group.id;

        delete group.id;
        delete group['users-with-access'];
        delete group['insts-with-access'];
        if (group.tags[0] == null) { group.tags = [] }

        return this.http.put(
            this.groupUrl + '/' + id,
            group
        )
        .map((res) => { return res.json() || {}; });
    }
}