# talkpile

> Let's build textual interfaces with bots

Just a sandbox for now. Excuse the mess.


## Install
```sh
npm i -g talkpile
```

## Start Client

Ensure `OPENAI_API_KEY` is set, then run:

```sh
talkpile
```

## Inject Auth (1Password)

If you use 1Password, you can use the following to inject your OpenAI API key into your shell:

1. [Get 1Password CLI](https://1password.com/downloads/command-line/)
2. Create a new vault called `talkpile`
3. Create a new "Secure Note" in the vault called `openai`
4. Add a password field the note called `api-key` containing your OpenAI API key - `op://talkpile/openai/api-key`
5. Optionally - Add a text field to the note called `org` containing your OpenAI organization ID - `op://talkpile/openai/org`

You can then run the following to inject the auth into your shell from any directory:

```sh
set -a; source <(talkpile-auth); set +a;
```
