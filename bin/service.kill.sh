#!/usr/bin/env bash

SIGNAL=${1:-"9"}

launchctl kill $SIGNAL gui/$UID/talkpile.service
