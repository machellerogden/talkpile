export default function get_context(session){
    return JSON.stringify(session.context, null, 2);
}

get_context.description = `Get the current context data for this session. Current user, current working directory, user's geographic location, and more.`;
