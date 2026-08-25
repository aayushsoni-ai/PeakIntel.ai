#!/bin/sh

git filter-branch --env-filter '
CORRECT_NAME="Aayush Soni"
CORRECT_EMAIL="aayushsoni516@gmail.com"

if [ "$GIT_COMMITTER_EMAIL" = "142428492+ankurraj2003@users.noreply.github.com" ] || [ "$GIT_AUTHOR_EMAIL" = "142428492+ankurraj2003@users.noreply.github.com" ] || [ "$GIT_COMMITTER_EMAIL" = "rajguptaankur@gmail.com" ] || [ "$GIT_AUTHOR_EMAIL" = "rajguptaankur@gmail.com" ]; then
    export GIT_COMMITTER_NAME="$CORRECT_NAME"
    export GIT_COMMITTER_EMAIL="$CORRECT_EMAIL"
    export GIT_AUTHOR_NAME="$CORRECT_NAME"
    export GIT_AUTHOR_EMAIL="$CORRECT_EMAIL"
fi
' --tag-name-filter cat -- --branches --tags
