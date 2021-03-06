import { Injectable } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { BehaviorSubject, Observable, Subject, pipe } from 'rxjs'
import { catchError, map } from 'rxjs/operators'
import { APP_CONST } from '../app.constants'

// Project Dependencies
import { environment } from 'environments/environment'
import { GroupList, ImageZoomParams } from 'datatypes'
import { ArtstorStorageService } from '../../../projects/artstor-storage/src/public_api';

@Injectable()
export class GroupService {

    private groupUrl: string
    private groupV1: string
    private options: {}

    public hasPrivateGroup: Observable<any>
    private hasPrivateGroupValue: boolean = false;
    private hasPrivateGroupSource: BehaviorSubject<boolean> = new BehaviorSubject(this.hasPrivateGroupValue);

    constructor(
        private _storage: ArtstorStorageService,
        private http: HttpClient
    ) {
        this.groupUrl = environment.API_URL + '/api/v2/group'
        /**
         * @deprecated 2019/03/14
         * Pending each group call to be update and moved to /v2
         */
        this.groupV1 = environment.API_URL + '/api/v1/group'
        this.options = { withCredentials: true }
        this.hasPrivateGroup = this.hasPrivateGroupSource.asObservable()
    }

    /**
     * Get All Groups
     * @param level Indicates access level of group: 'institution', 'private', 'public', 'all' or 'shared'
     * NOTE: v1.8.72 we pass 'created' as level instead of 'private'
     */
    public getAll(level: string, size?: number, pageNo ?: number, tags ?: string[], query ?: string, owner_id ?: string, sort ?: string, order ?: string ): Observable<GroupList> {
        if (!tags) {
            tags = []
        }
        if (!size) {
            size = APP_CONST.IMAGE_GROUP_PAGE_SIZE
        }
        if (!pageNo) {
            pageNo = 1
        }

        let tagParam = ''
        tags.forEach( tag => {
            tagParam += '&tags=' + encodeURIComponent(tag)
        })

        // if there is no sort, default it to be alphabetically
        if (!sort) {
            sort = 'alpha'
        }
        // Binder will sort by relevance if we don't pass any sort parameter
        if (sort === 'relevance') {
            if (query) {
                sort = ''
            } else {
                // This is for the edge case if we type nothing in the search box
                // In this case, we should still sort alphabetically
                sort = 'alpha'
            }
        }
        let sortParam = sort ? '&sort=' + sort : ''

        // Default the order to be descending when we sort by date
        if (sort === 'date' && !order) {
            order = 'desc'
        } else if (sort === 'alpha' && !order) {
            // Default the order to be ascending when we sort alphabetically
            order = 'asc'
        }
        let orderParam = order ? '&order=' + order : ''

        let queryParam: string = ''
        query && (queryParam = '&q=' + query)
        owner_id && (queryParam = '&owner_id=' + owner_id)

        let options = {
            headers: new HttpHeaders({'Accept': 'application/json;charset=UTF-8'}),
            withCredentials: true
        }

        return this.http.get<GroupList>(
            [this.groupUrl, '?size=', size, '&level=', level, '&from=', ( (pageNo - 1) * size),  tagParam, sortParam, orderParam, queryParam].join(''), options
        )
    }

    /**
     * Gets all group objects by looping through every page
     * @param level Indicates access level of group: 'institution', 'private', 'public', 'all' or 'shared'
     */
    public getEveryGroup(level: string): Observable<any[]> {
        let everyGroupSubject = new BehaviorSubject([])
        let everyGroupObservable = everyGroupSubject.asObservable()
        let size = 100 // max the service handles
        let pageNo = 1
        let totalPages = 1
        let groups: any [] = []

        // Get first page to find out how many Groups are available
        this.http.get(
            this.groupUrl + '?size=' + size + '&level=' + level + '&from=0', this.options
        ).toPromise()
        .then( data => {
            // Load first page
            groups = groups.concat(data['groups'])
            everyGroupSubject.next(groups)
            // Set total number of pages
            totalPages = (data['total'] / size) + 1
            // Increment pageNo since we just loaded the first page
            pageNo++

            for (pageNo; pageNo <= totalPages; pageNo++) {
                // Use locally scoped pageNo since Timeout fires after loop
                let thisPageNo = pageNo
                // Timeout for debouncing to prevent spamming the service
                setTimeout(() => {
                    this.http.get(
                        this.groupUrl + '?size=' + size + '&level=' + level + '&from=' + ( (thisPageNo - 1) * size), this.options
                    ).toPromise()
                    .then(data => {
                        groups = groups.concat(data['groups'])
                        everyGroupSubject.next(groups)
                    }, error => {
                        everyGroupSubject.error(error)
                    })
                }, Math.floor(pageNo / 5) * 1000 ) // Provide a debounce for every set of 5 calls
            }
        }, error => {
            everyGroupSubject.error(error)
        })

        return everyGroupObservable
    }

    /**
     * Check if a user has at least one Private Group
     */
    public hasPrivateGroups(forceReassess?: boolean): void {
        let cachedUser = this._storage.getLocal('user')
        let hasPrivate = cachedUser && cachedUser.isLoggedIn && this._storage.getLocal('hasPrivateGroups')
        if (hasPrivate && !forceReassess)  {
            this.hasPrivateGroupSource.next(true) 
        }
        else if (!(cachedUser && cachedUser.isLoggedIn)) {
            this.hasPrivateGroupSource.next(false) 
        } else {
            // forceReassess should fallback to querying the group service
            this.http.get(this.groupUrl + '?size=1&level=created', this.options)
            .toPromise()
            .then( res => {
                if (res['total'] > 0) {
                    this._storage.setLocal('hasPrivateGroups', true)
                    this.hasPrivateGroupSource.next(true)
                } else {
                    this._storage.setLocal('hasPrivateGroups', false)
                    this.hasPrivateGroupSource.next(false)
                }
            })
            .catch( error => {
                console.error( error )
            })
              
        }
    }

     /**
     * Get Individual Group
     */
    public get(groupId: string, detailViewFlag?: boolean): Observable<any> {
        // Use v2 endpoint under the detailView feature flag
      //let url = detailViewFlag ? this.groupUrl + '/' + groupId : this.groupUrl + '/' + groupId
      let url = this.groupUrl + '/' + groupId

      return this.http.get(
          url, this.options
      )
    }

    /**
     * Create Group
     */
    public create(group: any): Observable<any> {

      // Convert group V1 items to array of objects
      group.items = group.items.map(item => {
        return typeof(item) === 'string' ? { id: item } : item
      })

      return this.http.post(
          this.groupUrl,
          group,
          this.options
      ).pipe(map(data => {
          if (data['id']) {
            // If group created, ensure 'hasPrivateGroups' is true
            this._storage.setLocal('hasPrivateGroups', true)
            this.hasPrivateGroupSource.next(true)
          }
          return data
      }))
    }

    /**
     * Copy Group
     * Unused as of 2019/03/14
     */
    // public copy(igId: string, copygroup: any): Observable<any> {
    //     return this.http.post(
    //         this.groupUrl + '/' + igId + '/copy',
    //         copygroup,
    //         this.options
    //     )
    // }

    /**
     * Remove Group
     */
    public delete(groupId: string): Observable<any> {
        let reqUrl = this.groupV1 + '/' + groupId
        let headers = new HttpHeaders().set('Accept', 'application/json')
        let options = { headers: headers }

        return this.http.delete(reqUrl, this.options)
            .pipe(catchError(err =>
                this.http.post(
                    // Backup POST call for DELETE failures over Proxies
                    reqUrl,
                    {},
                    {
                      headers: new HttpHeaders({'Accept' : 'application/json', 'X-HTTP-Method-Override' : 'DELETE'}),
                      withCredentials: true
                    }
                )
            ), map(data => {
                // Reassess whether user has groups
                setTimeout(() => { // Allow elastic time to index groups
                    this.hasPrivateGroups(true)
                }, 400)
                return data
            }))
    }

    /**
     * Update Group. The body sent cannot contain id, insts-with-access or users-with-access
     */
    public update(group: any): Observable<any> {
        let id = group.id
        let putGroup = {}
        let reqUrl = this.groupUrl + '/' + id
        let updateProperties: string[] = [
            'description', 'owner_name', 'tags', 'owner_id', 'sequence_number', 'update_date', 'name', 'creation_date', 'access', 'items'
        ]

        // Contruct putGroup object, based on expected properties on backend groups update call
        for (let key in group) {
          if (updateProperties.indexOf(key) > -1) {

            // Group V2 Endpoint 'items' is no longer an array of strings,
            // // it is an array of objects, with each a single key named 'id' and value of type string
            if (key === 'items') {
              group.items = group.items.map(item => {
                return typeof(item) === 'string' ? { id: item } : item
              })
            }

            putGroup[key] = group[key]
          }
        }

        if (!putGroup['tags'] || putGroup['tags'][0] == null) { putGroup['tags'] = [] }

        return this.http.put(
            reqUrl,
            putGroup,
            this.options
        )
        .pipe(catchError(err =>
            this.http.post(
                // Backup POST call for PUT failures over Proxies
                reqUrl,
                putGroup,
                {
                  headers: new HttpHeaders({ 'Accept' : 'application/json', 'X-HTTP-Method-Override' : 'PUT' }),
                  withCredentials: true
                }
            )
        ))
    }

    /**
     * Makes call to generate a private group share token
     */
    public generateToken(id: string, options: { access_type: number, expiration_time?: Date }): Observable<any> {
        return this.http.post(
            [this.groupV1, id, 'share'].join('/'),
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
            [this.groupV1, 'redeem', token].join('/'),
            {},
            this.options
        );
    }

    /**
     * Make image group viewable to all users from all institutions - only allowable by Artstor user
     * @param igId The image group id to make global
     * @returns Observable resolved with { success: boolean, message: string }
     */
    public updateIgPublic(igId: string) {
        let reqUrl = [this.groupUrl, igId, 'admin', 'public'].join('/')
        let body = { public: true }

        return this.http.put(
            reqUrl,
            body,
            this.options
        )
        .pipe(catchError(err =>
            this.http.post(
                // Backup POST call for PUT failures over Proxies
                reqUrl,
                body,
                {
                  headers: new HttpHeaders({ 'Accept' : 'application/json', 'X-HTTP-Method-Override' : 'PUT' }),
                  withCredentials: true
                }
            )
        ))
    }

    /**
     * Get a list of Tag suggestions
     */
    public getTagSuggestions(term: string) {
        return this.http.get( this.groupV1 + '/tags/suggest?q=' + term + '&size=20', this.options)
    }

    /**
     * setZoomDetails - Use this method to ensures zoom details objects always
     * contain correct types and are of type ZoomedDetails across components.
     * @param zoom ZoomDetails object
     * @returns returns an instance of ZoomDetails
     */
    public setZoomDetails(zoom: ImageZoomParams): ImageZoomParams {
      for (let prop in zoom) {
        zoom[prop] = Math.round(zoom[prop])
      }
      return zoom
    }
}
