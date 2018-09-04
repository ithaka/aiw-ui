interface Scripts {
    name: string;
    src: string;
}
export const ScriptStore: Scripts[] = [
    { name: 'zendesk', src: '../../assets/js/zendesk.js' },
    { name: 'ethnio', src: '//ethn.io/92143.js' }
];

// <script type="text/javascript" language="javascript" src="//ethn.io/92143.js" async="true" charset="utf-8"></script>