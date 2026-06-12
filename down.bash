#!/bin/bash
if [ "$1" == "--prod" ]; then
    sudo COMPOSE_BAKE=true docker compose -f compose.yml down
    echo 'Stopped production server'
else
    sudo COMPOSE_BAKE=true docker compose -f compose.dev.yml down
    echo 'Stopped development server'
fi