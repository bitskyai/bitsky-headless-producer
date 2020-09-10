# BitSky Headless Producer

## Configuration

### Environment Variables

1. `BITSKY_BASE_URL`{String}: **Required**. Your BitSky Application's base url. Example: `https://bitsky.herokuapp.com`
2. `GLOBAL_ID`{String}: **Required**. Global ID of the headless producer you want to connect. Example: `YWdlbnQ6OjE1OTMwNjYzODY5MDU6OmU3MjAwZmU5LWViZTktNDc3Zi1hMDY1LTEzYjFiOTQ3YTAyMQ==`
3. `PRODUCER_SERIAL_ID`{String}: **Optional**. An UUID to idenity this producer, better you keep same value for this producer. If you didn't provide then it will automatically generate one for you. Example: `b7f6a100-9a35-4df3-bef9-2c1f6d8c866e`
4. `LOG_LEVEL`{String}: **Optional**. Winston logging level. Default is `info`, find detail from [Winston Logging Levels](https://github.com/winstonjs/winston#logging-levels)
5. `PRODUCER_HOME`{String}: **Optional**. How folder of your producer. You need to set absolute path. If you provide this, then like logs or screenshots will be stored in this folder. This is useful when you want to save the logs or screenshots in docker. You can mount a volumn to docker, and set `PRODUCER_HOME` to this volumn 5.`SCREENSHOT`{Boolean}: **Optional**. Take a screenshot of current page, Default will not take a screenshot. You can view them by open [http://{your producer host}:{port}/screenshots](http://{your_producer_host}:{port}/screenshots). All the screenshot name is `${timestamp}$-{task_global_id}`, for example: `1593489075864-aW50ZWxsaWdlbmNlOjoxNTkzNDg5MDQwNjkzOjoyMDc4YmQyYy0wNTY2LTRmOGQtYTUxZC01ZGZiZDVkNGQ4YzQ=`
6. `HEADLESS`{Boolean}: **Optional**. Whether to run browser in [headless mode](https://developers.google.com/web/updates/2017/04/headless-chrome). Default is `true`, will run headless mode. If you are not use docker image to deploy headless producer to heroku, then set `HEADLESS` to `false` is useless
7. `CUSTOM_FUNCTION_TIMEOUT`{Number}: **Optiona**. Timeout value when execute custom function. Default value is `60000`ms
8. `PORT`: **Optional**. Port number for this server. Default value is `80`, when you run it in docker mode, you can map host port to `80`
9. `HEADLESS_PORT`: **Optional**, Port number for your headless producer. This value is only used if you run **Headless Producer** in docker mode, in docker mode, we start a nginx to proxy **Headless Producer** and **NoVNC**.
10. `PUPPETEER_EXECUTABLE_PATH`: **Optional**. Path to a browser executable to run instead of the bundled Chromium. **Don't** change this value in Docker and Heroku
11. `PUPPETEER_USER_DATA_DIR`: **Optional**. Path to a User [Data Directory](https://chromium.googlesource.com/chromium/src/+/master/docs/user_data_dir.md). **Don't** change this value in Docker and Heroku
12. `VNC_PASSWD`: **Optional**. VNC password. Default value is `welcome`. **Only available for Docker**
13. `VNC_PORT`: **Optional**. Port to VNC server. Default value is `5900`. **Only available for Docker**
14. `NOVNC_PORT`: **Optional**. Port to [noVNC server](https://github.com/novnc/noVNC). Default value is `6090`. **Only available for Docker**
15. `VNC_RESOLUTION`: **Optional**. VNC resolution. Default value is `1024x768`. **Only available for Docker**

## Local

If you want to run it local, make sure you already installed [NodeJS](https://nodejs.org/en/) and [Yarn](https://yarnpkg.com/).

1. Install node_modules. `yarn install`
2. Start server
   ```
   export BITSKY_BASE_URL=http://10.0.0.247:9199 && \
   export GLOBAL_ID=YWdlbnQ6OjE1OTM0OTkyMTQ3ODc6OmI1Y2ZkYzY4LTE4OTctNDk0Yy04NTEwLTVkYjg0MGRlYjdlMg== && \
   npm start
   ```
   It start a server on local, you can access it [http://localhost:8090](http://localhost:8090)

> You also can change other Environment Variables

## Docker

### Use default configurations

```
docker run -p 80:80 \
           -e BITSKY_BASE_URL=http://10.0.0.247:9099 \
           -e GLOBAL_ID=YWdlbnQ6OjE1OTM0MDMyODEzMDU6OmE1ODQ0NWQzLTc2YWItNDA1Ny1hZmZjLWNhMjQyMWFhMmI1Mg==  bitskyai/headless-producer
```

> You also can change other Environment Variables

## Heroku

You can simply deploy this app to Heroku by click this button:
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)
