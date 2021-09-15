SERVER = http://rtsp.yunjiaiot.cn/push
SECRET = fpmpassword
STREAM_ID = abc
server:
	npx nodemon websocket-relay $(SECRET) 18081 18082

http:
	npx http-server . -d False -s --cors -c-1 -p 8099

convert:
	ffmpeg \
	-i rtsp://admin:Mima123456@172.16.11.64:554/h264/1/sub/av_stream \
	-an \
	-f mpegts \
		-codec:v mpeg1video -s 640x480 -b:v 100k -bf 0 \
		-muxdelay 0.001 \
	$(SERVER)/$(SECRET)/$(STREAM_ID)


convert-mac:
	ffmpeg \
	-f avfoundation -i "0"\
		-framerate 50 -video_size 640x480 \
	-f mpegts \
		-codec:v mpeg1video -s 640x480 -b:v 10k -bf 0 \
		-muxdelay 0.001 \
	$(SERVER)/$(SECRET)/$(STREAM_ID)

convert-test:
	ffmpeg \
	-stream_loop -1 \
	-re -i \
	test.mp4 \
	-an \
	-f mpegts \
		-codec:v mpeg1video -s 640x480 -b:v 100k -bf 0 \
		-muxdelay 0.001 \
	$(SERVER)/$(SECRET)/$(STREAM_ID)

convert-local:
	ffmpeg \
	-stream_loop -1 \
	-re -i \
	test.mp4 \
	-an \
	-f mpegts \
	-codec:v mpeg1video -s 640x480 -b:v 100k -bf 0 \
	-muxdelay 0.001 \
	$(SERVER)/$(SECRET)/$(STREAM_ID)

docker-build:
	docker build -t yfsoftcom/rtsp-websocket .

docker-push:
	docker push yfsoftcom/rtsp-websocket

docker-run:
	docker run -p 18081:8081 -p 18082:8082 -d yfsoftcom/rtsp-websocket