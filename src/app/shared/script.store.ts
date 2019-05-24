interface Scripts {
  name: string;
  src: string;
  innerText?: string;
}
export const ScriptStore: Scripts[] = [
  // Zendesk chat widget
  { name: 'zendesk', src: '../../assets/js/zendesk.js' },
  // Current survey: OIV, and Search
  { name: 'ethnio-survey', src: '//ethn.io/74606.js' }, // OIV
  { name: 'ethnio-search-survey', src: '//ethn.io/65777.js' }, // Search
  // Google API (Auth, Slides)
  { name: 'gapi', src: 'https://apis.google.com/js/api.js' }
];
