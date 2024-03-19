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
    "kits": {
        "pirate": {
            "name": "Jackdaw Hawkins",
            "command": "pirate",
            "import": "/Users/mac.heller-ogden/repos/github.com/machellerogden/talkpile-starter-kit/index.js",
            "model": "gpt-4-0125-preview",
            "temperature": 0.3,
            "frequency_penalty": 0.2,
            "presence_penalty": 0.2
        }
    }
}
```

Note kits are optional, and the `import` field is the path to a file that exports a function that returns a kit object. See the [starter kit](https://github.com/machellerogden/talkpile-starter-kit) for example.

# License

Apache-2.0
