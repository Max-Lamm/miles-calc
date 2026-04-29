#!/usr/bin/env bash
set -e
rsync -avz index.html styles.css maxlamm@hernmann.uberspace.de:~/html/tools.maxlamm.de/
