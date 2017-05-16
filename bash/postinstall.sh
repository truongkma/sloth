#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source $(dirname "${DIR}")/bash/include.sh
cd $(dirname "${DIR}")

success "Executing: postinstall.sh"
cp -R hooks .git
chmod -R +x .git/hooks
