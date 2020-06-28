#!/bin/bash
set -e

## print out help
help (){
echo "
USAGE:
docker run -it -p 5901:5901 -p 6901:6901 -p 8090:8090 -p 80:80 -e AGENT_SERIAL_ID=<serial id> -e MUNEW_BASE_URL=<munew base url> -e GLOBAL_ID=<headless agent globalId> munew/agents-headless

TAGS:
latest  stable version of branch 'master'
dev     current development version of branch 'dev'

OPTIONS:
-w, --wait      (default) keeps the UI and the vncserver up until SIGINT or SIGTERM will received
-s, --skip      skip the vnc startup and just execute the assigned command.
                example: docker run munew/agents-headless --skip bash
-d, --debug     enables more detailed startup output
                e.g. 'docker run munew/agents-headless --debug bash'
-h, --help      print out this help

Fore more information see: https://github.com/munew/dia-agents-headless
"
}
if [[ $1 =~ -h|--help ]]; then
    help
    exit 0
fi

## correct forwarding of shutdown signal
cleanup () {
    kill -s SIGTERM $!
    exit 0
}
trap cleanup SIGINT SIGTERM

# Generate nginx.conf
sh $NGINX_DIR/nginx.sh
sh $STARTUPDIR/nginx_startup.sh &
sh $STARTUPDIR/headless_startup.sh &

# start vnc
run_novnc