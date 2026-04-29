#!/usr/bin/env bash
set -e
rsync -avz index.html styles.css calculator.js \
  maxlamm@hernmann.uberspace.de:~/html/tools/miles-calc/
