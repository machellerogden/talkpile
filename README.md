# talkpile

> Hackable Agentic REPL

## Install
```sh
npm i -g talkpile
```

## Setup

```sh
talkpile-setup
```

## Start Service

Ensure `OPENAI_API_KEY` is present in your terminal environment, then run:

```sh
talkpile-service # Start the service in one terminal
```

> If you don't have an OpenAI API key, you can get one [here](https://platform.openai.com/signup).

## Start Client

```sh
talkpile # Start the client in another terminal
```

## Install as System Daemon (MacOS Only)

```sh
# Copy the starter plist file to your LaunchAgents directory.
cp ./etc/talkpile.service.plist ~/Library/LaunchAgents/talkpile.service.plist

# Edit the file, replacing all instances of `your-user-name`
# with your local username as used by your home folder and
# `your-api-key` with your actual OpenAI API key.
# `WorkingDirectory` should specific the directory where you
# cloned this repository.
# Update PATH environment variable to include any extra bin
# directories that you want Talkpile to be able to use.
vim ~/Library/LaunchAgents/talkpile.service.plist

# run...
talkpile-service-init
```


The `talkpile-service-init` command will register the service with launchctl, kickstart it, and then tail the logs to get you up and running.

Note that if you already have the service running, the `talkpile-service-init` command will stop the service, unload it, and then re-register it.

## Daemon Commands

Once you have the daemon installed, you can use the following commands to manage it:

```sh
# check service status
talkpile-service-info

# start the background service (restart if running)
talkpile-service-start

# tail the logs
talkpile-service-logs

# stop the service
talkpile-service-stop

# kill the service
talkpile-service-kill

# toggle verbose logging
talkpile-service-kill SIGPIPE

# register the service
talkpile-service-load

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

> Check your `~/.talkpile` directory after running `talkpile-setup` for examples of agent configurations and more. The setup creates plenty of examples to get you started.

# Talkpile Studio

## Build

```sh
npm run studio:clean
npm run studio:tauri build
```

## Develop

```sh
npm run studio:tauri dev
```

# License

Apache-2.0
