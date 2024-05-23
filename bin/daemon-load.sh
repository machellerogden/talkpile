#!/usr/bin/env bash
if [ -z $1 ]; then
  echo "Usage: $0 <plist>"
  exit 1
fi

launchctl bootstrap gui/$UID $1
