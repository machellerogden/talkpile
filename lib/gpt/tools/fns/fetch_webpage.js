import puppeteer from 'puppeteer';
import { compile as compileHtmlToText } from 'html-to-text';

const convertHtmlToText = compileHtmlToText({});

export default {
    async impl(session, args) {
        const { url } = args;
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: 'new',
                args: [ '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36' ]
            });
            const page = await browser.newPage();
            await page.goto(url, { waitUntil: 'networkidle0' });
            const html = await page.evaluate(() => document.querySelector('*').outerHTML);
            let text = convertHtmlToText(html);
            if (text?.length > 20000) { // TODO
                try {
                    console.log('attempting to downsize the text response');
                    text = await extract_main_content(session, { text })
                } catch (error) {
                    console.error('we tried to extract main content but failed', error.stack);
                }
            }
            try { await browser.close(); } catch {}
            return text;
        } catch (error) {
            console.error('error with fetch_webpage -', error.stack);
            try { await browser.close(); } catch {}
            return 'Error executing webpage fetch.';
        }
    },
    name: 'fetch_webpage',
    description: 'Fetch a webpage and return the HTML content.',
    parameters: {
        type: 'object',
        properties: {
            url: {
                type: 'string',
                description: 'URL of the webpage to fetch.'
            }
        },
        required: ['url']
    }
};

async function extract_main_content(session, args) {
    const { openai } = session;
    const { text } = args;
    try {
        const options = {
            model: 'gpt-3.5-turbo-16k',
            temperature: 0.3,
            n: 1,
            messages: [
                {
                    role: 'system',
                    content:
`Your job is to identify and extract the primary content from mixed-content text.

Your job is NOT to summarize but rather to identify and extract.

Retain as much detail as possible on the main content.

Be sure to include specific numbers/amounts/measurements if included within the source content.

Respond only with the content you have identified and no additional message.`
                },
                {
                    role: 'user',
                    content: text
                }
            ]
        };

        const response = await openai.chat.completions.create(options);

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
