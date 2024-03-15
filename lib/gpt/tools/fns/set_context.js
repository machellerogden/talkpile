export default function set_context(session, key, value){
    session.context[key] = value;
    return 'OK';
}

set_context.description = `Set a context variable for this session. This can be used to store data that can be used later in the session.`;
