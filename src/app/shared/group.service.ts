import { Injectable } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { BehaviorSubject, Observable, Subject, pipe } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { GroupList } from './datatypes'

// Project Dependencies
import { AuthService } from '.'
import { environment } from 'environments/environment'

@Injectable()
export class GroupService {

    private groupV1: string = ''
    private groupV2: string = ''
    private options: {}

    constructor(
        private http: HttpClient
    ) {
        this.groupV1 = environment.API_URL + '/api/v1/group'
        this.groupV2 = environment.API_URL + '/api/v2/group'
        this.options = { withCredentials: true }
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
            size = 48
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
            [this.groupV1, '?size=', size, '&level=', level, '&from=', ( (pageNo - 1) * size),  tagParam, sortParam, orderParam, queryParam].join(''), options
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
            this.groupV1 + '?size=' + size + '&level=' + level + '&from=0', this.options
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
                        this.groupV1 + '?size=' + size + '&level=' + level + '&from=' + ( (thisPageNo - 1) * size), this.options
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
    public hasPrivateGroups(): Observable<any> {
      return this.http.get(this.groupV1 + '?size=1&level=private', this.options)
    }

     /**
     * Get Individual Group
     */
    public get(groupId: string, detailViewFlag?: boolean): Observable<any> {
        // Use v2 endpoint under the detailView feature flag
      //let url = detailViewFlag ? this.groupV2 + '/' + groupId : this.groupV1 + '/' + groupId
      let url = this.groupV2 + '/' + groupId

      return this.http.get(
          url, this.options
      )
    }

    /**
     * Create Group
     */
    public create(group: any): Observable<any> {

        // @todo 1810 Need to be able to create a new group with zoomed detail!!!
        console.log('group: ', group)
        group.items = group.items.map(item => {
          return typeof(item) === 'string' ? { id: item } : item
        })

        return this.http.post(
            this.groupV2,
            group,
            this.options
        )
    }

    /**
     * Copy Group
     */
    public copy(igId: string, copygroup: any): Observable<any> {
        return this.http.post(
            this.groupV1 + '/' + igId + '/copy',
            copygroup,
            this.options
        )
    }

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
            ))
    }

    /**
     * Update Group. The body sent cannot contain id, insts-with-access or users-with-access
     */
    public update(group: any): Observable<any> {
        let id = group.id
        let putGroup = {}
        let reqUrl = this.groupV2 + '/' + id
        let updateProperties: string[] = [
            'description', 'owner_name', 'tags', 'owner_id', 'sequence_number', 'update_date', 'name', 'creation_date', 'access', 'items'
        ]

        // Contruct putGroup object, based on expected properties on backend groups update call
        for (let key in group) {
          if (updateProperties.indexOf(key) > -1) {

            // @TODO 1810 Cleanup
            // // Group V2 Endpoint 'items' is no longer an array of strings,
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
    public updateIgPublic(igId: string, makePublic: boolean) {
        let reqUrl = [this.groupV1, igId, 'admin', 'public'].join('/')
        let body = { public: makePublic }

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
    public setZoomDetails(zoom: ZoomDetails): ZoomDetails {
      for (let prop in zoom) {
        zoom[prop] = Math.round(zoom[prop])
      }
      return zoom
    }
}

interface ZoomDetails {
  viewerX: number
  viewerY: number
  pointWidth: number
  pointHeight: number
  index: number
}
