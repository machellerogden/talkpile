import { cwd } from 'process';

export default function pwd(session){
    return cwd();
}

pwd.description = 'Print the current working directory.';
