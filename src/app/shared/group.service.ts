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
        this.groupUrl = this._auth.getHostname() + '/api/v1/group';
        this.options = new RequestOptions({ withCredentials: true });
    }

    /**
     * Get All Groups
     */
    public getAll(level: string, size?: number, pageNo ?: number, tags ?: string[] ):
     Observable<any> {
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
            this.groupUrl + "?size=" + size + '&level=' + level + '&from=' + ( (pageNo - 1) * size) +  tagParam, this.options
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
            this.groupUrl + '/' + groupId, this.options
        );
    }
        
    /**
     * Create Group
     */
    public create(group: any): Observable<any> {
        return this.http.post(
            this.groupUrl,
            group,
            this.options
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
            copygroup,
            this.options
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

        return this.http.delete(this.groupUrl + '/' + groupId, this.options)
            .map(res => <any> res.json());
    }

    /**
     * Update Group. The body sent cannot contain id, insts-with-access or users-with-access
     */
    public update(group: any): Observable<any> {
        let id = group.id
        let putGroup = Object.assign({}, group)

        delete putGroup.id
        delete putGroup['users-with-access']
        delete putGroup['insts-with-access']
        delete putGroup['public']
        delete putGroup['count']
        delete putGroup['thumbnails']
        
        if (!putGroup.tags || putGroup.tags[0] == null) { putGroup.tags = [] }

        return this.http.put(
            this.groupUrl + '/' + id,
            putGroup,
            this.options
        )
        .map((res) => { return res.json() || {} })
    }

    /** 
     * Makes call to generate a private group share token
     */
    public generateToken(id: string, options: { access_type: number, expiration_time?: Date }): Observable<any> {
        return this.http.post(
            [this.groupUrl, id, "share"].join("/"),
            {}, // this call does not have any options for a body
            this.options
        )
        .map((res) => { return res.json() || {} })
    }

    /**
     * Redeems an image group share token and returns an image group
     * @param token The image group share token
     */
    public redeemToken(token: string): Observable<ImageGroup> {
        return this.http.post(
            [this.groupUrl, "redeem", token].join("/"),
            {},
            this.options
        )
        .map((res) => { return res.json() || {} })
    }
}