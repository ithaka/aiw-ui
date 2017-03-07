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
        // this.groupUrl = '//artstor-group-service.apps.test.cirrostratus.org/api/v1/group';
        this.groupUrl = '//' + this._auth.getSubdomain() + '.artstor.org/api/v1/group';
        let headers = new Headers({ 'Content-Type': 'application/json' });
        this.options = new RequestOptions(headers);
    }

    /**
     * Get All Groups
     */
    public getAll(): Observable<any> {
        return this.http.get(
            this.groupUrl
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
     * Remove Group
     */
    public delete(groupId: string): Observable<any> {
        return this.http.delete(
            this.groupUrl + '/' + groupId
        );
    }

    /**
     * Update Group
     */
    public update(group: ImageGroup): Observable<any> {
        let putGroup: ImageGroup = <ImageGroup>{};
        Object.assign(putGroup, group);
        delete putGroup.id;
        delete putGroup['users-with-access'];
        delete putGroup['insts-with-access'];

        return this.http.put(
            this.groupUrl + '/' + group.id,
            putGroup
            // this.options
            // {}
        )
        .map((res) => { return res.json() || {}; });
    }
}