// import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms'


export class SearchQueryUtil {
  constructor() {}

  /**
   * Prepares and returns search string query
   * @param fieldQueries 
   * @param appliedFilters 
   */
  public generateSearchQuery(fieldQueries: any[]) : string {

    let advQuery = ""

    fieldQueries.forEach( (query, index) => {
      if (!query.field || !query.field.name || query.term.length < 1) {
        return
      }
      
      if (index !== 0) {
        advQuery += "#" + query.operator.toLowerCase() + ","
      }

      advQuery += query.term + '|' + query.field.value
    })
    
    if (advQuery.length < 1) {
      advQuery = "*"
    }

    return advQuery
  }

  public generateFilters(appliedFilters: any, dateFilter: any) : any {
      // Load filters!
    let filterParams = {}

    // Apply date filter
    if (dateFilter['startDate'] && dateFilter['endDate']) {
      filterParams['startDate'] = dateFilter['startDate'] * (dateFilter['startEra'] == 'BCE' ? -1 : 1)
      filterParams['endDate'] = dateFilter['endDate'] * (dateFilter['endEra'] == 'BCE' ? -1 : 1)
    }
    
    for (let filter of appliedFilters) {
      if (filterParams[filter.group]) {
        filterParams[filter.group].push(filter.value)
      } else {
        filterParams[filter.group] = [filter.value]
      }
    }

    return filterParams
  }
}