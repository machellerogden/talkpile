import axios from 'axios';

export const handler = async (session, agent, args) => {
    const { url } = args;
    let text;
    try {
        const response = await axios.get(`https://r.jina.ai/${url}`);
        text = response.data;
    } catch (error) {
        console.error('error with fetch_webpage -', error.stack);
        text = 'Error executing webpage fetch.';
    }
    return text;
};
