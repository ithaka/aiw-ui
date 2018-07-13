import { Injectable } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs/Rx';
import { GroupList } from './datatypes';

// Project Dependencies
import { AuthService } from '.';

@Injectable()
export class GroupService {

    private groupUrl: string = ''
    private options: {}

    constructor(
        private http: HttpClient,
        private _auth: AuthService
    ) {
      this.groupUrl = this._auth.getHostname() + '/api/v1/group'
        this.options = { withCredentials: true }
    }

    /**
     * Get All Groups
     * @param level Indicates access level of group: 'institution', 'private', 'public', 'all' or 'shared'
     */
    public getAll(level: string, size?: number, pageNo ?: number, tags ?: string[], query ?: string, owner_id ?: string ): Observable<GroupList> {
        if (!tags) {
            tags = []
        }
        if (!size) {
            size = 48
        }
        if (!pageNo) {
            pageNo = 1
        }

        let tagParam = ""
        tags.forEach( tag => {
            tagParam += '&tags=' + encodeURIComponent(tag)
        })

        let queryParam: string = ''
        query && (queryParam = '&q=' + query)
        owner_id && (queryParam = '&owner_id=' + owner_id)

        return this.http.get<GroupList>(
            [this.groupUrl, "?size=", size, '&level=', level, '&from=', ( (pageNo - 1) * size),  tagParam, queryParam].join(''), this.options
        )
    }

    /**
     * Gets all group objects by looping through every page
     * @param level Indicates access level of group: 'institution', 'private', 'public', 'all' or 'shared'
     */
    public getEveryGroup(level: string) : Observable<any[]> {
        let everyGroupSubject = new BehaviorSubject([])
        let everyGroupObservable = everyGroupSubject.asObservable()
        let size = 100 // max the service handles
        let pageNo = 1
        let totalPages = 1
        let groups: any [] = []

        // Get first page to find out how many Groups are available
        this.http.get(
            this.groupUrl + "?size=" + size + '&level=' + level + '&from=0', this.options
        ).toPromise()
        .then( data => {
            // Load first page
            groups = groups.concat(data['groups'])
            everyGroupSubject.next(groups)
            // Set total number of pages
            totalPages = (data['total']/size) + 1
            // Increment pageNo since we just loaded the first page
            pageNo++

            for(pageNo; pageNo <= totalPages; pageNo++) {
                // Use locally scoped pageNo since Timeout fires after loop
                let thisPageNo = pageNo
                // Timeout for debouncing to prevent spamming the service
                setTimeout(() => {
                    this.http.get(
                        this.groupUrl + "?size=" + size + '&level=' + level + '&from=' + ( (thisPageNo - 1) * size), this.options
                    ).toPromise()
                    .then(data => {
                        groups = groups.concat(data['groups'])
                        everyGroupSubject.next(groups)
                    }, error => {
                        everyGroupSubject.error(error)
                    })
                // Provide a debounce for every set of 5 calls
                }, Math.floor(pageNo/5) * 1000 )
            }
        }, error => {
            everyGroupSubject.error(error)
        })

        return everyGroupObservable
    }

     /**
     * Get Individual Group
     */
    public get(groupId: string): Observable<any> {
        return this.http.get(
            this.groupUrl + '/' + groupId, this.options
        )
    }

    /**
     * Create Group
     */
    public create(group: any): Observable<any> {
        return this.http.post(
            this.groupUrl,
            group,
            this.options
        )
    }

    /**
     * Copy Group
     */
    public copy(igId: string, copygroup: any): Observable<any> {
        return this.http.post(
            this.groupUrl + '/' + igId + '/copy',
            copygroup,
            this.options
        )
    }

    /**
     * Remove Group
     */
    public delete(groupId: string): Observable<any> {
        let reqUrl = this.groupUrl + '/' + groupId
        let headers = new HttpHeaders().set('Accept', 'application/json')
        let options = { headers: headers }

        return this.http.delete(reqUrl, this.options)
            .catch(err =>
                this.http.post(
                    // Backup POST call for DELETE failures over Proxies
                    reqUrl,
                    {},
                    {
                      headers: new HttpHeaders({'Accept' : 'application/json', 'X-HTTP-Method-Override' : 'DELETE'}),
                      withCredentials: true
                    }
                )
            )
    }

    /**
     * Update Group. The body sent cannot contain id, insts-with-access or users-with-access
     */
    public update(group: any): Observable<any> {
        let id = group.id
        let putGroup = {}
        let reqUrl = this.groupUrl + '/' + id
        let updateProperties: string[] = [
            'description', 'tags', 'sequence_number', 'update_date', 'name', 'creation_date', 'access', 'items'
        ]

        // Contruct putGroup object, based on expected properties on backend groups update call
        for(let key in group){
            if (updateProperties.indexOf(key) > -1) {
                putGroup[key] = group[key]
            }
        }

        if (!putGroup['tags'] || putGroup['tags'][0] == null) { putGroup['tags'] = [] }

        return this.http.put(
            reqUrl,
            putGroup,
            this.options
        )
        .catch(err =>
            this.http.post(
                // Backup POST call for PUT failures over Proxies
                reqUrl,
                putGroup,
                {
                  headers: new HttpHeaders({ 'Accept' : 'application/json', 'X-HTTP-Method-Override' : 'PUT' }),
                  withCredentials: true
                }
            )
        )
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
    }

    /**
     * Redeems an image group share token and returns an image group
     * @param token The image group share token
     * @returns Observable with { success: boolean, group: any }, although I'm not sure how to specify that in the typescript
     */
    public redeemToken(token: string): Observable<{ success: boolean, group: any }> {
        return this.http.post<{ success: boolean, group: any }>(
            [this.groupUrl, "redeem", token].join("/"),
            {},
            this.options
        );
    }

    /**
     * Make image group viewable to all users from all institutions - only allowable by Artstor user
     * @param igId The image group id to make global
     * @returns Observable resolved with { success: boolean, message: string }
     */
    public updateIgPublic(igId: string, makePublic: boolean) {
        let reqUrl = [this.groupUrl,igId, "admin", "public"].join("/")
        let body = { public: makePublic }

        return this.http.put(
            reqUrl,
            body,
            this.options
        )
        .catch(err =>
            this.http.post(
                // Backup POST call for PUT failures over Proxies
                reqUrl,
                body,
                {
                  headers: new HttpHeaders({ 'Accept' : 'application/json', 'X-HTTP-Method-Override' : 'PUT' }),
                  withCredentials: true
                }
            )
        )
    }

    /**
     * Get a list of Tag suggestions
     */
    public getTagSuggestions(term: string) {
        return this.http.get( this.groupUrl + "/tags/suggest?q=" + term + "&size=20", this.options)
    }
}
