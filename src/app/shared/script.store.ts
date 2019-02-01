interface Scripts {
  name: string;
  src: string;
}
export const ScriptStore: Scripts[] = [
  { name: 'zendesk', src: '../../assets/js/zendesk.js' },
  // Current survey: Image groups
  { name: 'ethnio-survey', src: '//ethn.io/32197.js' }
];
