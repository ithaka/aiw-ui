import { BehaviorSubject, Observable } from 'rxjs/Rx'
import { SearchQueryUtil } from './search-query';

describe('SearchQueryUtil', () => {
    let queryUtil: SearchQueryUtil

    beforeEach(() => {
        queryUtil = new SearchQueryUtil()
    })

    /**
     * Test generating query string from multi-field queries
     */
    describe('prepareQuery', () => {
        let mockQueries = [ {
            term: 'Van Gogh',
            field: {
                    'name' : 'Creator',
                    'value' : 100
                },
            operator: 'AND'
        }, {
            term: 'Sunflowers',
            field: {
                    'name' : 'Title',
                    'value' : 101
                },
            operator: 'OR'
        }]

        it('should process a multi-field search query', () => {
            let generatedQuery: string = queryUtil.generateSearchQuery(mockQueries)

            expect(generatedQuery).toBe('Van Gogh|100#or,Sunflowers|101')
        })

        it('should process an empty multi-field query as wildcard', () => {
            let generatedQuery: string = queryUtil.generateSearchQuery([])

            expect(generatedQuery).toBe('*')
        })
    })

    /**
     * Test generating filter object for route navigation
     */
    describe('prepareFilterObject', () => {
        let mockFilters = [
            {
                group: 'geography',
                value: 500040
            },
            {
                group: 'geography',
                value: 500030
            },
            {
                group: 'geography',
                value: 500010
            },
            {
                group: 'classification',
                value: 401000
            }
        ]
        let mockDateFilter = {
            endDate : 2010,
            endEra : 'CE',
            startDate : 100,
            startEra : 'BCE'
        }

        it('should process search filters', () => {
            let filterObj: string = queryUtil.generateFilters(mockFilters, mockDateFilter)

            expect(filterObj['startDate']).toBe(-100)
            expect(filterObj['endDate']).toBe(2010)
            expect(filterObj['classification'][0]).toBe(401000)
            expect(filterObj['geography'].length).toBe(3)
        })
    })
})
