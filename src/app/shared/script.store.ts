interface Scripts {
  name: string;
  src: string;
  innerText?: string;
}
export const ScriptStore: Scripts[] = [
  // Zendesk chat widget
  { name: 'zendesk', src: '../../assets/js/zendesk.js' },
  // Current survey: Zoomed Details
  { name: 'ethnio-survey', src: '//ethn.io/74606.js' },
  // Mouseflow script on search results page
  { name: 'mouseflow', src: '//cdn.mouseflow.com/projects/ed275939-452f-4323-9079-e697e3e3ba30.js' },
  // Google API (Auth, Slides)
  { name: 'gapi', src: 'https://apis.google.com/js/api.js' }
];
