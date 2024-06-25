import axios from 'axios';

async function extract_main_content(session, agent, args) {
    try {
        const { text } = args;
        const request = {
            model: 'gpt-4o',
            temperature: 0.3,
            n: 1,
            messages: [
                {
                    role: 'system',
                    content:
`Your job is to identify and extract the primary content from a textual representation of a webpage. The textual representation will often contain a lot of extraneous information, such as navigation links, advertisements, and other content that is not the main focus of the page.

Your job is NOT to summarize but rather to identify and extract. Use as much detail as necessary to retain the main content.

Retain as much detail as possible! Be sure to include specific number (amounts, measurements, etc) if included within the source content.

Add a prefix to your response to indicate that the content has been processed.`
                },
                {
                    role: 'user',
                    content: text
                }
            ]
        };
        const response = await session.openai.chat.completions.create(request);
        const { error, usage, choices } = response;
        if (error) {
            const e = new Error('error with extract_main_content');
            e.data = error;
            throw e;
        }
        const [ choice ] = choices ?? [];
        const { finish_reason, message } = choice;
        // TODO: continue if finish_reason === 'length'
        if (!['stop','length'].includes(finish_reason)) throw new Error('unacceptable finish_reason: ' + finish_reason);
        if (!message.content?.length) throw new Error('no content');
        return message.content;
    } catch (error) {
        console.error('error with extract_main_content -', error.data ?? error.stack);
        return 'Unable to extract webpage content';
    }
}

export const handler = async (session, agent, args) => {
    const { url } = args;
    let text;
    try {
        const response = await axios.get(`https://r.jina.ai/${url}`);
        text = response.data;
        if (text?.length > 80000) {
            try {
                console.log('attempting to downsize the text response');
                text = await extract_main_content(session, agent, { text })
            } catch (error) {
                console.error('we tried to extract main content but failed', error.stack);
                text = 'Error extracting main content.';
            }
        }
    } catch (error) {
        console.error('error with fetch_webpage -', error.stack);
        text = 'Error executing webpage fetch.';
    }
    return text;
};
