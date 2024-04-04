export default {
    impl(session){
        return session.context.working_directory;
    },
    name: 'pwd',
    description: 'Print the current working directory.'
};
