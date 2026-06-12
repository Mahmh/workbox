#!/bin/bash
if [ "$1" == "--prod" ]; then
    echo 'Running production server'
    sudo COMPOSE_BAKE=true docker compose -f compose.yml up --build -d
else
    echo 'Running development server'
    sudo COMPOSE_BAKE=true docker compose -f compose.dev.yml up --build
fi