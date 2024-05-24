#!/usr/bin/env bash

launchctl kill 9 gui/$UID/talkpile.service
launchctl bootout gui/$UID/talkpile.service
rm ~/Library/Logs/talkpile.service.stdout.log
rm ~/Library/Logs/talkpile.service.stderr.log
touch ~/Library/Logs/talkpile.service.stdout.log
touch ~/Library/Logs/talkpile.service.stderr.log

launchctl bootstrap gui/$UID ~/Library/LaunchAgents/talkpile.service.plist
launchctl print gui/$UID/talkpile.service

launchctl kickstart -kp gui/$UID/talkpile.service

tail -n 500 -f ~/Library/Logs/talkpile.service.stdout.log ~/Library/Logs/talkpile.service.stderr.log
