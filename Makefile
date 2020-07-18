server:
	node websocket-relay fpmpassword 8081 8082
http:
	npx http-server . -d False -s --cors -c-1 -p 8099
convert:
	# ffmpeg -i rtsp://192.168.88.205:8554/ -f mpegts http://192.168.88.111:8081/fpmpassword
	ffmpeg \
	-f v4l2 \
		-framerate 25 -video_size 640x480 -i /dev/video0 \
	-f mpegts \
		-codec:v mpeg1video -s 640x480 -b:v 1000k -bf 0 \
		-muxdelay 0.001 \
	http://open.yunplus.io:8081/fpmpassword


docker-build:
	docker build -t yfsoftcom/rtsp-websocket .

docker-push:
	docker push yfsoftcom/rtsp-websocket

docker-run:
	docker run -p 8081:8081 -p 8082:8082 -d yfsoftcom/rtsp-websocket