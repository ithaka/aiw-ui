// import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms'


export class SearchQueryUtil {
  constructor() {}

  /**
   * LEGACY
   * Prepares and returns search string query
   * @param fieldQueries
   * @param appliedFilters
   */
  public generateLegacySearchQuery(fieldQueries: any[]): string {

    let advQuery = ''

    // Process our query objects into the legacy search query syntax
    fieldQueries.forEach( (query, index) => {
      if (!query.field || !query.field.name || query.term.length < 1) {
        return
      }

      if (index !== 0) {
        advQuery += '#' + query.operator.toLowerCase() + ','
      }

      advQuery += query.term + '|' + query.field.value
    })

    if (advQuery.length < 1) {
      advQuery = '*'
    }

    return advQuery
  }

  /**
   * LEGACY
   * Returns filter object to pass router.navigate
   */
  public generateLegacyFilters(appliedFilters: any, dateFilter: any): any {
    let filterParams = {}

    if (dateFilter['startDate'] && dateFilter['endDate']) {
      // Pass BCE dates as negative numbers
      filterParams['startDate'] = dateFilter['startDate'] * (dateFilter['startEra'] == 'BCE' ? -1 : 1)
      filterParams['endDate'] = dateFilter['endDate'] * (dateFilter['endEra'] == 'BCE' ? -1 : 1)
    }

    // Put filters into an object with field name as key
    for (let filter of appliedFilters) {
      if (filterParams[filter.group]) {
        filterParams[filter.group].push(filter.value)
      } else {
        filterParams[filter.group] = [filter.value]
      }
    }

    return filterParams
  }

  /**
   * Prepares and returns search string query
   * @param fieldQueries
   * @param appliedFilters
   */
  public generateSearchQuery(fieldQueries: any[]): string {

    let advQuery = ''

    // Process our query objects into the legacy search query syntax
    fieldQueries.forEach( (query, index) => {
      if (!query.field || !query.field.name || query.term.length < 1) {
        return
      }

      // If not first query, append operator
      if (index !== 0) {
        advQuery += ' ' + query.operator.toUpperCase() + ' '
      }
      advQuery += query.field.value ? `${query.field.value}:(${query.term})` : `${query.term}`
      // advQuery += (query.field.value && query.field.value == "") ? `${query.field.value}:(${query.term})` : `(${query.term})`
    })

    if (advQuery.length < 1) {
      advQuery = '*'
    }

    return advQuery
  }

  /**
   * Returns filter object to pass router.navigate
   */
  public generateFilters(appliedFilters: any, dateFilter: any): any {
    let filterParams = {}

    if (dateFilter['startDate'] || dateFilter['endDate']) {
      if (dateFilter['startDate']) {
        // Pass BCE dates as negative numbers
        filterParams['startDate'] = dateFilter['startDate'] * (dateFilter['startEra'] == 'BCE' ? -1 : 1)
      } else {
        filterParams['startDate'] = '*'
      }

      if (dateFilter['endDate']) {
        // Pass BCE dates as negative numbers
        filterParams['endDate'] = dateFilter['endDate'] * (dateFilter['endEra'] == 'BCE' ? -1 : 1)
      } else {
        filterParams['endDate'] = '*'
      }
    }

    // Put filters into an object with field name as key
    for (let filter of appliedFilters) {
      let filterValue = filter.group === 'geography' ? filter.efq : filter.value
      if (filterParams[filter.group]) {
        filterParams[filter.group].push(filterValue)
      } else {
        filterParams[filter.group] = [filterValue]
      }
    }

    return filterParams
  }
}
