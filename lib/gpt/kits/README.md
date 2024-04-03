## Kit Schema

name string
description string
command string
messages record[]
getPrelude () => record[]
fns {[name string]: Function(session, args) => string | record{name string, description string, parameters string[]}}
getTools () => record[]


provider string
model string

max_tokens integer
temperature real
top_p real
n real
frequency_penalty real
presence_penalty real
