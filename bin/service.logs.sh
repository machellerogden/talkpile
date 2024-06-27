#!/usr/bin/env bash

tail -q -n 1000 -f ~/Library/Logs/talkpile.service.stdout.log ~/Library/Logs/talkpile.service.stderr.log | awk '{ print; fflush(stdout) }'
