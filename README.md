# BitSky Headless Producer

## Configuration

### Environment Variables

1. `BITSKY_BASE_URL`{String}: **Required**. Your BitSky Application's base url. Example: `https://bitsky.herokuapp.com`
2. `GLOBAL_ID`{String}: **Required**. Global ID of the headless producer you want to connect. Example: `YWdlbnQ6OjE1OTMwNjYzODY5MDU6OmU3MjAwZmU5LWViZTktNDc3Zi1hMDY1LTEzYjFiOTQ3YTAyMQ==`
3. `PRODUCER_SERIAL_ID`{String}: **Optional**. An UUID to idenity this producer, better you keep same value for this producer. If you didn't provide then it will automatically generate one for you. Example: `b7f6a100-9a35-4df3-bef9-2c1f6d8c866e`
4. `PRODUCER_HOME`{String}: **Optional**. How folder of your producer. You need to set absolute path. If you provide this, then like logs or screenshots will be stored in this folder. This is useful when you want to save the logs or screenshots in docker. You can mount a volumn to docker, and set `PRODUCER_HOME` to this volumn 5.`SCREENSHOT`{Boolean}: **Optional**. Take a screenshot of current page, Default will not take a screenshot. You can view them by open [http://{your producer host}:{port}/screenshots](http://{your_producer_host}:{port}/screenshots). All the screenshot name is `${timestamp}$-{task_global_id}`, for example: `1593489075864-aW50ZWxsaWdlbmNlOjoxNTkzNDg5MDQwNjkzOjoyMDc4YmQyYy0wNTY2LTRmOGQtYTUxZC01ZGZiZDVkNGQ4YzQ=`
5. `LOG_LEVEL`{String}: **Optional**. Winston logging level. Default is `info`, find detail from [Winston Logging Levels](https://github.com/winstonjs/winston#logging-levels)
6. `HEADLESS`{Boolean}: **Optional**. Whether to run browser in [headless mode](https://developers.google.com/web/updates/2017/04/headless-chrome). Default is `true`, will run headless mode. If you are not use docker image to deploy headless producer to heroku, then set `HEADLESS` to `false` is useless
7. `SCREENSHOT`{Boolean}: **Optional**. Whether to create screenshot for each Task.
8. `CUSTOM_FUNCTION_TIMEOUT`{Number}: **Optiona**. Timeout value when execute custom function. Default value is `60000`ms
9. `ABORT_RESOURCE_TYPES`{String}: **Optional**. What kind of resource type you want to abort, use `,` to sperate each type. This is useful for improve performance and crawl speed. Default `''`. Possible [Resource Types](https://pptr.dev/#?product=Puppeteer&version=v5.3.1&show=api-httprequestresourcetype)
10. `PORT`: **Optional**. Port number for this server. Default value is `80`, when you run it in docker mode, you can map host port to `80`
11. `HEADLESS_PORT`: **Optional**, Port number for your headless producer. This value is only used if you run **Headless Producer** in docker mode, in docker mode, we start a nginx to proxy **Headless Producer** and **NoVNC**.
12. `PUPPETEER_EXECUTABLE_PATH`: **Optional**. Path to a browser executable to run instead of the bundled Chromium. **Don't** change this value in Docker and Heroku
13. `PUPPETEER_USER_DATA_DIR`: **Optional**. Path to a User [Data Directory](https://chromium.googlesource.com/chromium/src/+/master/docs/user_data_dir.md). **Don't** change this value in Docker and Heroku
14. `VNC_PASSWD`: **Optional**. VNC password. Default value is `welcome`. **Only available for Docker**
15. `VNC_PORT`: **Optional**. Port to VNC server. Default value is `5900`. **Only available for Docker**
16. `NOVNC_PORT`: **Optional**. Port to [noVNC server](https://github.com/novnc/noVNC). Default value is `6090`. **Only available for Docker**
17. `VNC_RESOLUTION`: **Optional**. VNC resolution. Default value is `1024x768`. **Only available for Docker**

## Local

If you want to run it local, make sure you already installed [NodeJS](https://nodejs.org/en/) and [Yarn](https://yarnpkg.com/).

1. Install node_modules. `npm install`
2. Start server
   ```
   export BITSKY_BASE_URL=http://10.0.0.247:9199 && \
   export GLOBAL_ID=b36edeb8-a43e-4230-9a43-676092010e5e  && \
   npm start
   ```
   It start a server on local, you can access it [http://localhost:8090](http://localhost:8090)

> You also can change other Environment Variables

## Docker

> **Important**
>
> To avoid inside Docker Container cannot access `host` network, `BITSKY_BASE_URL` should be your currently **IP Address**, don't use `localhost` or `127.0.0.1`.
> Same for `Retailer` address, in docker env, don't use `locahost` or `127.0.01`, use **IP Address**


### Use default configurations
Except `BITSKY_BASE_URL` and `GLOBAL_ID`, other configurations keep it as default.

```bash
docker run -p 8100:80 \
           -e BITSKY_BASE_URL=http://10.0.0.247:9099 \
           -e GLOBAL_ID=b36edeb8-a43e-4230-9a43-676092010e5e \
           bitskyai/headless-producer
```

### Persist Log, Screenshot or Chrome Session
If you want to persist log, screenshot or chrome session

```
docker run -p 8100:80 \
           -v /Users/neo/Downloads/headless/:/usr/headless \
           -v /Users/neo/Downloads/headless/chromium:/home/alpine/.config/chromium/Default \
           -e PRODUCER_HOME=/usr/headless \
           -e PRODUCER_SERIAL_ID=e64ce61c-9793-4c62-9922-c835be270326 \
           -e BITSKY_BASE_URL=http://10.0.0.247:9099 \
           -e GLOBAL_ID=b36edeb8-a43e-4230-9a43-676092010e5e \
           bitskyai/headless-producer
```

You can access Headless producer by [http://localhost:8100](http://localhost:8100), view VNC UI [http://localhost:8100/vnc/?password=welcome](http://localhost:8100/vnc/?password=welcome)

> You also can change other Environment Variables

## Heroku

You can simply deploy this app to Heroku by click this button:
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)
