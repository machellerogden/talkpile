import puppeteer from 'puppeteer';
import { compile as compileHtmlToText } from 'html-to-text';

const convertHtmlToText = compileHtmlToText({});

export const handler = async (session, agent, args) => {
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
        if (text?.length > 80000) { // TODO
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
};

async function extract_main_content(session, args) {
    const { openai } = session;
    const { text } = args;
    try {
        const request = {
            model: 'gpt-4o',
            temperature: 0.3,
            n: 1,
            messages: [
                {
                    role: 'system',
                    content:
`Your job is to identify and extract the primary content from mixed-content text.

Your job is NOT to summarize but rather to identify and extract. Use as much detail as necessary to retain the main content.

Retain as much detail as possible! Be sure to include specific number (amounts, measurements, etc) if included within the source content.

Respond ONLY with the content you have identified.`
                },
                {
                    role: 'user',
                    content: text
                }
            ]
        };

        const response = await openai.chat.completions.create(request);

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
