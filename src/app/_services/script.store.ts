interface Scripts {
  name: string;
  src: string;
  innerText?: string;
}
export const ScriptStore: Scripts[] = [
  // Zendesk chat widget
  { name: 'zendesk', src: '../../assets/js/zendesk.js' },
  // Ethnio, current survey on all pages
  { name: 'ethnio-survey', src: '//ethn.io/65028.js' },
  // Google API (Auth, Slides)
  { name: 'gapi', src: 'https://apis.google.com/js/api.js' },
  // Ethnio, advanced search survey
  { name: 'advanced-search-survey', src: '//ethn.io/62676.js'}
];
