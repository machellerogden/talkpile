export default {
    impl(session, agent){
        return session.context.working_directory;
    },
    name: 'pwd',
    description: 'Print the current working directory.'
};
