interface Scripts {
  name: string;
  src: string;
}
export const ScriptStore: Scripts[] = [
  { name: 'zendesk', src: '../../assets/js/zendesk.js' },
  // Current survey: Recruit some users to test workflows across Artstor, JSTOR, and Forum for unified experience. 
  { name: 'ethnio-survey', src: '//ethn.io/65315.js' }
];
