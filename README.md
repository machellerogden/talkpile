# talkpile

> Hackable Agentic REPL

## Install
```sh
npm i -g talkpile
```

## Start Client

Ensure `OPENAI_API_KEY` is set, then run:

```sh
talkpile
```

## Configure

Run `talkpile settings` to locate your settings file.

Here's an example settings file:

```json
{
	"name": "Mac",
	"geolocation": "Chicago, IL",
	"context": {
		"paths": {
			"notes_dir": "/Users/mac/Library/Mobile Documents/iCloud~md~obsidian/Documents/Green"
		}
	},
	"agents": {
		"pirate": {
			"name": "Jackdaw Hawkins",
			"designation": "ahoy"
		}
	}
}
```

# License

Apache-2.0
