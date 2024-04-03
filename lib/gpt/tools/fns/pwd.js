import { cwd } from 'process';

export default {
    impl(session){
        return cwd();
    },
    name: 'pwd',
    description: 'Print the current working directory.'
};
