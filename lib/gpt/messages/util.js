export const SystemMessage = (content) => ({ role: 'system', content });
export const AssistantMessage = (content) => ({ role: 'assistant', content });
export const UserMessage = (content, name = 'user') => ({ role: 'user', content, name });
