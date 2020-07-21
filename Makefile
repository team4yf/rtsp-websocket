server:
	npx nodemon websocket-relay fpmpassword 18081 18082
http:
	npx http-server . -d False -s --cors -c-1 -p 8099
convert:
	# ffmpeg -i rtsp://192.168.88.205:8554/ -f mpegts http://192.168.88.111:18081/fpmpassword
	ffmpeg \
	-f v4l2 \
		-framerate 50 -video_size 640x480 -i /dev/video0 \
	-f mpegts \
		-codec:v mpeg1video -s 640x480 -b:v 10k -bf 0 \
		-muxdelay 0.001 \
	http://open.yunplus.io:18081/fpmpassword/abc


convert-mac:
	ffmpeg \
	-f avfoundation -i "0"\
		-framerate 50 -video_size 640x480 \
	-f mpegts \
		-codec:v mpeg1video -s 640x480 -b:v 10k -bf 0 \
		-muxdelay 0.001 \
	http://open.yunplus.io:18081/fpmpassword/abc

convert-test:
	ffmpeg \
	-stream_loop -1 \
	-re -i \
	test.mp4 \
	-an \
	-f mpegts \
		-codec:v mpeg1video -s 640x480 -b:v 100k -bf 0 \
		-muxdelay 0.001 \
	http://localhost:18081/fpmpassword/abc

docker-build:
	docker build -t yfsoftcom/rtsp-websocket .

docker-push:
	docker push yfsoftcom/rtsp-websocket

docker-run:
	docker run -p 18081:8081 -p 18082:8082 -d yfsoftcom/rtsp-websocket