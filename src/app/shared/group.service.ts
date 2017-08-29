import { Injectable } from '@angular/core'
import { Http, Response, Headers, RequestOptions } from '@angular/http'
import { BehaviorSubject, Observable, Subject } from 'rxjs/Rx';

// Project Dependencies
import { AuthService, ImageGroup } from '.'

@Injectable()
export class GroupService {

    private groupUrl: string = ''
    private options: RequestOptions

    constructor(
        private http: Http,
        private _auth: AuthService
    ) {
        this.groupUrl = this._auth.getHostname() + '/api/v1/group'
        this.options = new RequestOptions({ withCredentials: true })
    }

    /**
     * Get All Groups
     * @param level Indicates access level of group: 'institution', 'private', 'public', 'all' or 'shared'
     */
    public getAll(level: string, size?: number, pageNo ?: number, tags ?: string[], query ?: string ): Observable<any> {
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

        return this.http.get(
            [this.groupUrl, "?size=", size, '&level=', level, '&from=', ( (pageNo - 1) * size),  tagParam, queryParam].join(''), this.options
        ).map(
            res => {
                let body = res.json()
                return body || { }
            }
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
        ).map(
            res => {
                let body = res.json()
                return body || { }
            }
        ).toPromise()
        .then( data => {
            // Load first page
            groups = groups.concat(data.groups)
            everyGroupSubject.next(groups)
            // Set total number of pages
            totalPages = (data.total/size) + 1
            // Increment pageNo since we just loaded the first page
            pageNo++
            
            for(pageNo; pageNo <= totalPages; pageNo++) {
                // Use locally scoped pageNo since Timeout fires after loop
                let thisPageNo = pageNo
                // Timeout for debouncing to prevent spamming the service
                setTimeout(() => {
                    this.http.get(
                        this.groupUrl + "?size=" + size + '&level=' + level + '&from=' + ( (thisPageNo - 1) * size), this.options
                    ).map(
                        res => {
                            let body = res.json()
                            return body || { }
                        }
                    ).toPromise()
                    .then(data => {
                        groups = groups.concat(data.groups)
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
        ).map(
            res => {
                let body = res.json()
                return body || { }
            },
            err => {
                console.error('Creating Image Group failed')
            }
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
        ).map(
            res => {
                let body = res.json()
                return body || { }
            }
        )
    }

    /**
     * Remove Group
     */
    public delete(groupId: string): Observable<any> {
        let headers = new Headers({ 'Accept' : 'application/json' })
        let options = new RequestOptions({ headers: headers })

        return this.http.delete(this.groupUrl + '/' + groupId, this.options)
            .map(res => <any> res.json())
    }

    /**
     * Update Group. The body sent cannot contain id, insts-with-access or users-with-access
     */
    public update(group: any): Observable<any> {
        let id = group.id
        let putGroup = Object.assign({}, group)

        if(putGroup.igDownloadInfo){
            delete putGroup.igDownloadInfo
        }

        delete putGroup.id
        delete putGroup['public']
        delete putGroup['count']
        delete putGroup['thumbnails']
        delete putGroup['igDownloadInfo']
        
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
     * @returns Observable with { success: boolean, group: ImageGroup }, although I'm not sure how to specify that in the typescript
     */
    public redeemToken(token: string): Observable<{ success: boolean, group: ImageGroup }> {
        return this.http.post(
            [this.groupUrl, "redeem", token].join("/"),
            {},
            this.options
        )
        .map((res) => { return res.json() || {} })
    }

    /**
     * Make image group viewable to all users from all institutions - only allowable by Artstor user
     * @param igId The image group id to make global
     * @returns Observable resolved with { success: boolean, message: string }
     */
    public updateIgPublic(igId: string, makePublic: boolean) {
        return this.http.put(
            [this.groupUrl,igId, "admin", "public"].join("/"),
            { public: makePublic },
            this.options
        )
        .map((res) => { return res.json() || {} })
    }
}