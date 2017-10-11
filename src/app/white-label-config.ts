/**
 * White Label Vertical theming/config objects
 */

/**
 * These are assigned as defaults
 */
export const WLV_ARTSTOR = {
    pageTitle: "Artstor",
    logoUrl: "/assets/img/logo-v1-1.png",
    footerLinks: [
        "ABOUT",
        "GETTING_STARTED",
        "TEACHING_IDEAS",
        "STAY_INFORMED",
        "TERMS",
        "PRIVACY",
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
    featuredCollection: "HOME.FEATURED",
    showHomeBlog: true
}

export const WLV_SAHARA = {
    "logoUrl" : "/assets/img/logo-sahara-v1.png",
    "institutionLogin" : false,
    "pageTitle" : "SAHARA",
    footerLinks: [
        "ARTSTOR",
        "SAHARA",
        "SARARA_CONTRIBUTE",
        "SAHARA_TERMS",
        "SAHARA_PRIVACY"
    ],
    browseOptions: {
        'artstorCol': false,
        'instCol': true,
        'openCol': false,
        'myCol': false,
        'igs': true
    },
    featuredCollection: "HOME.SAHARA_FEATURED",
    homeBrowseSec: {
        'collection': false,
        'instCollection': true,
        'classification': false,
        'geography': false,
        'teachingResources': false,
        'imageGrps': false
    },
    showHomeBlog: false
}
