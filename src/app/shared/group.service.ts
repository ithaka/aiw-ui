import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Rx';

// Project Dependencies
import { AuthService } from './auth.service';

@Injectable()
export class GroupService {

    private groupUrl: string = '';

    constructor(
        private http: Http,
        private _auth: AuthService
    ) {
        this.groupUrl = '//artstor-group-service.apps.test.cirrostratus.org/api/v1/group';
    }

    /**
     * Get All Groups
     */
    public getAll(): Observable<any> {
        return this.http.get(
            this.groupUrl
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
        // return this.http.delete(
        //     this.groupUrl + '/' + groupId
        // );
        return this.http.delete(this.groupUrl + '/' + groupId)
            .map(res => <any> res.json());
    }

    /**
     * Update Group
     */
    public update(group: any): Observable<any> {
        return this.http.post(
            this.groupUrl + '/' + group.id,
            group
        );
    }
}