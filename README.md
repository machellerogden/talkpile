# talkpile

> Hackable Agentic REPL

## Install
```sh
npm i -g talkpile
```

## Start Service

Ensure `OPENAI_API_KEY` is set, then run:

```sh
talkpile-service # Start the service in one terminal
```

## Start Client

```sh
talkpile # Start the client in another terminal
```

## Run as daemon with `launchctl`

```sh
# copy the starter plist file to your LaunchAgents directory
cp ./etc/talkpile.service.plist ~/Library/LaunchAgents/talkpile.service.plist

# edit the file, replacing placeholders
vim ~/Library/LaunchAgents/talkpile.service.plist

# register it as a daemon with launchctl
talkpile-service-load

# check service status
talkpile-service-info

# start the background service
talkpile-service-start

# tail the logs
talkpile-service-logs

# stop the service
talkpile-service-stop

# kill the service
talkpile-service-kill

# unregister the service
talkpile-service-unload
```

## Talkpile Configuration

Configuration is stored in a `.talkpile.yaml` files.

Files are searched for in the following locations:

1. The current working directory, or any parent directory of the current working directory
2. The user's home directory (`$HOME` or `%USERPROFILE%`)
3. The system's config directory (`/usr/local/etc` or `C:\ProgramData`)

The data of all found files is deeply merged, with the most specific file taking precedence.

Here's an example `.talkpile.yaml` file:

```yaml
user:
  name: Mac
  location: Chicago, IL
context:
  notes_dir: /Users/mac/Library/Mobile Documents/iCloud~md~obsidian/Documents/Green
agents:
  pirate:
    designation: pirate
    name: Jackdaw Hawkins
```

See `.talkpile/` directory for more examples.

# License

Apache-2.0
