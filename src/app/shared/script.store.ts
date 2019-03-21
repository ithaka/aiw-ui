interface Scripts {
  name: string;
  src: string;
}
export const ScriptStore: Scripts[] = [
  // Zendesk chat widget
  { name: 'zendesk', src: '../../assets/js/zendesk.js' },
  // Current survey: Zoomed Details
  { name: 'ethnio-survey', src: '//ethn.io/16703.js' },
  // Google API (Auth, Slides)
  { name: 'gapi', src: 'https://apis.google.com/js/api.js' }
];
