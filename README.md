# talkpile

> Hackable Agentic REPL

## Install
```sh
npm i -g talkpile
```

## Start Client

Ensure `OPENAI_API_KEY` is set, then run:

```sh
talkpile-daemon # Start the daemon in one terminal
```

```sh
talkpile # Start the client in another terminal
```

## Configure

Here's an example `.talkpile.yaml` file:

```yaml
user:
  name: Mac
  location: Chicago, IL
context:
  paths:
    notes_dir: /Users/mac/Library/Mobile Documents/iCloud~md~obsidian/Documents/Green
agents:
  pirate:
    designation: pirate
    name: Jackdaw Hawkins
```

# License

Apache-2.0
