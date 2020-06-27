FROM alpine:3.12.0

LABEL maintainer="Munew docker maintainers <help.munewio@gmail.com>"
ENV REFRESHED_AT 2020-06-27

# Make sure all the user has same environment
COPY alpine/config /etc/skel/.config

# Installs latest Chromium package.
RUN set -xe \
    && echo "http://dl-cdn.alpinelinux.org/alpine/edge/main" > /etc/apk/repositories \
    && echo "http://dl-cdn.alpinelinux.org/alpine/edge/community" >> /etc/apk/repositories \
    && echo "http://dl-cdn.alpinelinux.org/alpine/edge/testing" >> /etc/apk/repositories \
    && echo "http://dl-cdn.alpinelinux.org/alpine/v3.11/main" >> /etc/apk/repositories \
    && apk upgrade -U -a \
    && apk add --no-cache \
    xvfb \
    x11vnc \ 
    xfce4 \ 
    xfce4-terminal \ 
    paper-icon-theme \
    arc-theme \
    libstdc++ \
    python \
    chromium \
    harfbuzz \
    nss \
    freetype \
    ttf-freefont \
    wqy-zenhei \
    bash \
    sudo \
    htop \
    procps \
    curl \
    && rm -rf /var/cache/* \
    && mkdir /var/cache/apk

RUN set -xe \
  # && echo "@testing http://dl-cdn.alpinelinux.org/alpine/edge/testing"  >> /etc/apk/repositories \
  # && apk --update --no-cache add xvfb x11vnc@testing xfce4 xfce4-terminal paper-icon-theme arc-theme@testing chromium python bash sudo htop procps curl \
  && mkdir -p /usr/share/wallpapers \
  && echo "CHROMIUM_FLAGS=\"--disable-dev-shm-usage --no-sandbox --disable-gpu-sandbox --disable-gpu --user-data-dir --window-position=0,0\"" >> /etc/chromium/chromium.conf \
  && addgroup alpine \
  && adduser -G alpine -s /bin/bash -D alpine \
  && echo "alpine:alpine" | /usr/sbin/chpasswd \
  && echo "alpine ALL=NOPASSWD: ALL" >> /etc/sudoers \
  && apk del curl 

COPY alpine/bk-the-milk-way.jpg /usr/share/wallpapers/

USER alpine

ENV USER=alpine \
    DISPLAY=:1 \
    LANG=en_US.UTF-8 \
    LANGUAGE=en_US.UTF-8 \
    HOME=/home/alpine \
    TERM=xterm \
    SHELL=/bin/bash \
    VNC_PASSWD=alpinelinux \
    VNC_PORT=5900 \
    VNC_RESOLUTION=1024x768 \
    VNC_COL_DEPTH=24  \
    NOVNC_PORT=6080 \
    NOVNC_HOME=/home/alpine/noVNC 

RUN set -xe \
  && sudo apk update \
  # && sudo apk add ca-certificates wget \
  # && sudo update-ca-certificates \
  && mkdir -p $NOVNC_HOME/utils/websockify \
  && wget -qO- https://github.com/novnc/noVNC/archive/v1.1.0.tar.gz | tar xz --strip 1 -C $NOVNC_HOME \
  && wget -qO- https://github.com/novnc/websockify/archive/v0.9.0.tar.gz | tar xzf - --strip 1 -C $NOVNC_HOME/utils/websockify \
  && chmod +x -v $NOVNC_HOME/utils/*.sh \
  && ln -s $NOVNC_HOME/vnc_lite.html $NOVNC_HOME/index.html \
  && sudo apk del wget

WORKDIR $HOME
EXPOSE $VNC_PORT $NOVNC_PORT

COPY alpine/run_novnc /usr/bin/

CMD ["run_novnc"]
