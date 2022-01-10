interface Scripts {
  name: string;
  src: string;
  innerText?: string;
}
export const ScriptStore: Scripts[] = [
  // Zendesk chat widget
  { name: 'zendesk', src: '../../assets/js/zendesk.js' },
  // Ethnio, current survey on image groups, search results, item detail page
  { name: 'ethnio-survey', src: '//ethn.io/85427.js' },
  // Google API (Auth, Slides)
  { name: 'gapi', src: 'https://apis.google.com/js/api.js' },
  // Ethnio, advanced search survey
  { name: 'advanced-search-survey', src: '//ethn.io/62676.js'}
];
