// Notes for pilots and co-pilots
//
// We are recreating a simplified VIM-like interface.
export const MODE = {
    normal: 'normal',
    insert: 'insert',
    command: 'command',
    visual: 'visual'
    // I do not care about "replace" mode. In my experience, it is redundant.
    // I am curious however to explore whether or not it makes sense in fact
    // to treat "replace" a first-class mode for non-obvious reasons that I
    // might not have considered... does it perhaps better conceptualize
    // or perhaps simplify ochestration or workflow?
};
