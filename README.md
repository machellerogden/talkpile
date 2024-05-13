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
		},
		"recruiter": {
			"name": "The Bobs",
			"designation": "hr",
			"description": "Responsible for updating the Talkpile team roster",
			"instructions": "You're job is to manage the `agents` data inside `/Users/mac/Library/Preferences/talkpile-nodejs/config.js`. Adding a agent entry to the `agents` object will add a member to the team.\n\n",
			"postscript": "",
			"temperature": 0.3,
			"frequency_penalty": 0.2,
			"presence_penalty": 0.1
		}
	}
}

```

# License

Apache-2.0
