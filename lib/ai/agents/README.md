## Agent Schema

designation string
name string
description string
messages record[]
getPrelude () => record[]
tools {[name string]: Function(session, args) => string | record{name string, description string, parameters string[]}}
getTools () => record[]


provider string
model string

max_tokens integer
temperature real
top_p real
n real
frequency_penalty real
presence_penalty real
