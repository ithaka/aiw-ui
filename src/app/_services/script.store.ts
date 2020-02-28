interface Scripts {
  name: string;
  src: string;
  innerText?: string;
}
export const ScriptStore: Scripts[] = [
  // Zendesk chat widget
  { name: 'zendesk', src: '../../assets/js/zendesk.js' },
  // Google API (Auth, Slides)
  { name: 'gapi', src: 'https://apis.google.com/js/api.js' }
];
