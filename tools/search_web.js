import axios from 'axios';

export const handler = async (session, agent, args) => {
    const { query } = args;
    let text;
    try {
        const response = await axios.get(`https://s.jina.ai/${encodeURIComponent(query)}`);
        text = response.data;
    } catch (error) {
        console.error('error with web search -', error.stack);
        text = 'Error executing web search.';
    }
    return text;
};
