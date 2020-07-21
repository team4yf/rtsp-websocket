## Rtsp-websocket

Camera -> RTSP -> FFMPEG -> Server -> Websocket -> JSMpeg -> Live .

### Run in docker

`$ docker run -p 18081:8081 -p 18082:8082 -d yfsoftcom/rtsp-websocket`

### Push rtsp

```bash
ffmpeg -i rtsp://192.168.88.205:8554/ -f mpegts http://[yourhost]/fpmpassword/abc
```

Demo: http://[yourhost]/static/demo.html


### API

- GET /api/list

- GET /api/get/:sn