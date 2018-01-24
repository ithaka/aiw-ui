interface Scripts {
    name: string;
    src: string;
}  
export const ScriptStore: Scripts[] = [
    { name: 'zendesk', src: '../../assets/js/zendesk.js' },
    { name: 'ethnio-ig-survey', src: '//ethn.io/83020.js' }
];