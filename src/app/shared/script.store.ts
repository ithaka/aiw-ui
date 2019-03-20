interface Scripts {
  name: string;
  src: string;
}
export const ScriptStore: Scripts[] = [
  { name: 'zendesk', src: '../../assets/js/zendesk.js' },
  // Current survey: Zoomed Details
  { name: 'ethnio-survey', src: '//ethn.io/16703.js' },
  { name: 'gapi', src: 'https://apis.google.com/js/api.js' }
];
