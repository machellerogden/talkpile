import { packageTools } from './index.js';

export const printIntro = async (session, agent) => {
   const text = session.config.templates.intro({
      agent
   });
   return text;
};

export const printTeam = async (session, agent) => {
    const team = Object.values(session.agents)
        .filter(({ designation }) => designation != agent.designation);
   const text = session.config.templates.team({
      team
   });
   return text;
};

export const printTools = async (session, agent) => {
   const tools = await packageTools(session, agent);
   const text = session.config.templates.tools({
      tools: Object.values(tools)
   });
   return text;
};

export const printLessons = async (session, agent) => {
   const text = session.config.templates.lessons({
      agent
   });
   return text;
};

export const printFooter = (session, agent) => {
   const text = session.config.templates.sendoff({
      now: new Date().toLocaleString(),
      contextJson: JSON.stringify(session.context, null, 2),
      agent
   });
   return text;
};

export async function printHeader(session, agent) {
   return [
      await printIntro(session, agent),
      await printTeam(session, agent),
      await printTools(session, agent),
      await printLessons(session, agent)
   ].join('\n').trim() + '\n';
}
