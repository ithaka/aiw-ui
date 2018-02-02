/**
 * Interfaces for objects returned by Solr Search
 */
export interface SolrFacet {
    name: string,
    count: number,
    efq: string,
    fq: string,
    // Additional property for Hierarchical facets
    children?: SolrFacet[]
    // Value added by the UI
    title?: string
}