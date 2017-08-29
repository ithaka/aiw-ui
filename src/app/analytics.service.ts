import { Injectable } from '@angular/core';

// Reference to imported Adobe script in index.html
declare var _satellite: any;
// Reference Adobe page layer object
declare var DDO: any;
// Reference Raven object for Sentry reporting
declare var Raven: any;

    // </script>
interface DataLayer {
    pageInfo:{
        pageName: string,
        pageID: string
    },
    user:{
        userInstitution: string
    }
}


@Injectable()
export class AnalyticsService {
    public pageData: DataLayer;

    constructor() { 
        this.pageData = DDO.pageData;
    }
    
    public directCall(eventName: string) {
        try {
            _satellite && _satellite.track && _satellite.track(eventName);
        } catch(error) {
            console.error(error)
        }   
    }

    public setPageName(name: string) {
        this.pageData.pageInfo.pageName = name
    }

    /**
     * Set an ID value relevant to the content of the page (eg. Asset ID, Collection ID)
     */
    public setPageID(id: string) {
        this.pageData.pageInfo.pageID = id
    }

    /** 
     * Set logged in user's institution
     */
    public setUserInstitution(institution: string) {
        this.pageData.user.userInstitution = institution
        Raven.setUserContext({
            institution: institution
        });
    }

    /**
     * Clear all values from Adobe pageData object
     */
    public clearPageData() {
        this.setPageID('')
        this.setPageName('')
        this.setUserInstitution('')
    }

    /**
     * Set Page values on navigating to a new page
     */
    public setPageValues(name: string, id: string) {
        this.setPageID(id)
        this.setPageName(name)
    }
}