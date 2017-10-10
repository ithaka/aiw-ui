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
    showHomeBlog: true,
    featuredCollection: "HOME.FEATURED"
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
    showHomeBlog: false,
    featuredCollection: "HOME.SAHARA_FEATURED"
}
