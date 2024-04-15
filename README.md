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
	"kits": {
		"pirate": {
			"name": "Jackdaw Hawkins",
			"command": "ahoy"
		},
		"recruiter": {
			"name": "The Bobs",
			"command": "hr",
			"description": "Responsible for updating the Talkpile team roster",
			"identity": "You're job is to manage the `kits` data inside `/Users/mac/Library/Preferences/talkpile-nodejs/config.js`. Adding a kit entry to the `kits` object will add a member to the team.\n\n",
			"postscript": "",
			"temperature": 0.3,
			"frequency_penalty": 0.2,
			"presence_penalty": 0.1
		}
	}
}

```

Note kits are optional, and the `import` field is the path to a file that exports a function that returns a kit object. See the [starter kit](https://github.com/machellerogden/talkpile-starter-kit) for example.

# License

Apache-2.0
