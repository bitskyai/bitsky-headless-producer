FROM ubuntu:18.04

LABEL maintainer="Munew docker maintainers <help.munewio@gmail.com>"
ENV REFRESHED_AT 2020-02-03

## Connection ports for controlling the UI:
# VNC port:5901
# noVNC webport, connect via http://IP:6901/?password=welcome
ENV DISPLAY=:1 \
    NO_VNC_PORT=6901 \
    VNC_PORT=5901 \
    HEADLESS_PORT=8090 \
    NGINX_PORT=80
EXPOSE $VNC_PORT $NO_VNC_PORT $HEADLESS_PORT $NGINX_PORT

## Headless agent config
ENV SCREENSHOT=false\
    HEADLESS=true

### Envrionment config
ENV HOME=/munew \
    TERM=xterm \
    STARTUPDIR=/dockerstartup \
    AGENT_DIR=/munew/agent \
    INST_SCRIPTS=/munew/agent/scripts/install \
    NGINX_DIR=/munew/agent/scripts/nginx \
    NO_VNC_HOME=/munew/noVNC \
    DEBIAN_FRONTEND=noninteractive \
    VNC_COL_DEPTH=24 \
    VNC_RESOLUTION=1024x768 \
    VNC_PW=welcome \
    VNC_VIEW_ONLY=false
WORKDIR $HOME

### Copy all install scripts for further steps
COPY ./scripts/install/ ${INST_SCRIPTS}/
COPY ./scripts/nginx/ ${NGINX_DIR}/
COPY ./workers ${AGENT_DIR}/workers/
COPY ./index.js ${AGENT_DIR}/
COPY ./package.json ${AGENT_DIR}/
COPY ./utils-docker.js ${AGENT_DIR}/utils.js
COPY ./yarn.lock ${AGENT_DIR}/
COPY ./README.md ${AGENT_DIR}/
RUN find ${INST_SCRIPTS} -name '*.sh' -exec chmod a+x {} +

### Install some common tools
RUN ${INST_SCRIPTS}/tools.sh
ENV LANG='en_US.UTF-8' LANGUAGE='en_US:en' LC_ALL='en_US.UTF-8'

### Install custom fonts
RUN ${INST_SCRIPTS}/install_custom_fonts.sh

### Install xvnc-server & noVNC - HTML5 based VNC viewer
RUN ${INST_SCRIPTS}/tigervnc.sh
RUN ${INST_SCRIPTS}/no_vnc.sh

### Install firefox and chrome browser
RUN ${INST_SCRIPTS}/chrome.sh

### Install NodeJS and Yarn
RUN ${INST_SCRIPTS}/nodejs_yarn.sh

### Install only production node_modules
RUN cd ${AGENT_DIR}/ && yarn --production=true

### Install xfce UI
RUN ${INST_SCRIPTS}/xfce_ui.sh
COPY ./scripts/xfce/ $HOME/

### configure startup
RUN ${INST_SCRIPTS}/libnss_wrapper.sh
COPY ./scripts/startup $STARTUPDIR
RUN ${INST_SCRIPTS}/set_user_permission.sh $STARTUPDIR $HOME $NGINX_DIR

USER 0

ENTRYPOINT ["/dockerstartup/vnc_startup.sh"]
CMD ["--wait"]


# Metadata
LABEL munew.image.vendor="Munew" \
    munew.image.url="https://munew.io" \
    munew.image.title="Munew Headless Agent" \
    munew.image.description="Response for collect intelligence data and send back to Analyst Service." \
    munew.image.version="v0.1.1" \
    munew.image.documentation="https://docs.munew.io"