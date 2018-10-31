/**
 * White Label Vertical theming/config objects
 */

/**
 * These are assigned as defaults
 */
export const WLV_ARTSTOR = {
    pageTitle: "Artstor",
    siteID: "ARTSTOR",
    logoUrl: "/assets/img/logo-v1-1.png",
    contributingInstFilters : [],
    isOpenAccess: true,
    footerLinks: [
        "ABOUT",
        "GETTING_STARTED",
        "TEACHING_IDEAS",
        "STAY_INFORMED",
        "TERMS",
        "PRIVACY",
        "COOKIE_POLICY",
        "COPYRIGHT",
        "SUPPORT"
    ],
    browseOptions: {
        'artstorCol': true,
        'instCol': true,
        'openCol': true,
        'myCol': true,
        'igs': true
    },
    homeBrowseSec: {
        'collection': true,
        'instCollection': false,
        'classification': true,
        'geography': true,
        'teachingResources': true,
        'imageGrps': true
    },
    advSearch: {
      showCollectionTypeFacet: true
    },
    featuredCollection: "HOME.FEATURED",
    showHomeBlog: true,
    showHomeSSC: true,
    showHomeAd: true,
    showArtstorCurated: true,
    showInstitutionalLogin: true,
    pwResetPortal: "ARTstor"
}

export const WLV_SAHARA = {
    logoUrl : "/assets/img/logo-sahara-v1.png",
    saharaLogin: true,
    institutionLogin : false,
    isOpenAccess: false,
    disableIPAuth : true,
    pageTitle : "SAHARA",
    siteID: "SAHARA",
    contributingInstFilters : [22240],
    footerLinks: [
        "ARTSTOR",
        "SAHARA",
        "SARARA_CONTRIBUTE_PROD",
        "SARARA_CONTRIBUTE_STAGE",
        "SAHARA_TERMS",
        "SAHARA_PRIVACY",
        "COOKIE_POLICY"
    ],
    showSSLogin: true,
    showInstitutionalLogin: false,
    browseOptions: {
        'artstorCol': false,
        'instCol': true,
        'openCol': false,
        'myCol': false,
        'igs': true
    },
    featuredCollection: "HOME.SAHARA_FEATURED",
    copyModifier: "SAHARA",
    homeBrowseSec: {
        'collection': false,
        'instCollection': true,
        'classification': false,
        'geography': false,
        'teachingResources': false,
        'imageGrps': true
    },
    advSearch: {
      showCollectionTypeFacet: false
    },
    showHomeBlog: false,
    showHomeSSC: false,
    showHomeAd: false,
    showArtstorCurated: false,
    pwResetPortal: "sahara"
}
