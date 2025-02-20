// Set up basic variables for app
const record = document.querySelector(".record");
const stop = document.querySelector(".stop");
const recordingsList = document.querySelector(".recordings-list");
const canvas = document.querySelector(".visualizer");
const mainSection = document.querySelector(".main-controls");

// Disable stop button while not recording
stop.disabled = true;

// Visualiser setup - create web audio api context and canvas
let audioCtx;
const canvasCtx = canvas.getContext("2d");

// Main block for doing the audio recording
if (navigator.mediaDevices.getUserMedia) {
  console.log("The mediaDevices.getUserMedia() method is supported.");

  const constraints = { audio: true };
  let chunks = [];

  let onSuccess = function (stream) {
    const mediaRecorder = new MediaRecorder(stream);

    visualize(stream);

    record.onclick = function () {
      mediaRecorder.start();
      console.log(mediaRecorder.state);
      console.log("Recorder started.");
      record.style.background = "red";

      stop.disabled = false;
      record.disabled = true;
    };

    stop.onclick = function () {
      mediaRecorder.stop();
      console.log(mediaRecorder.state);
      console.log("Recorder stopped.");
      record.style.background = "";
      record.style.color = "";

      stop.disabled = true;
      record.disabled = false;
    };

    mediaRecorder.onstop = function (e) {
      console.log("Recording stopped");
      
      // 移除等待消息（如果存在）
      const waitingMessage = document.querySelector('.waiting-message');
      if (waitingMessage) {
        waitingMessage.remove();
      }
      
      // 创建新的录音项容器
      const recordingItem = document.createElement('div');
      recordingItem.className = 'recording-item';
      
      // 创建音频部分
      const audioSection = document.createElement('div');
      audioSection.className = 'audio-section';
      
      const audio = document.createElement('audio');
      audio.setAttribute('controls', '');
      
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.className = 'delete';
      
      audioSection.appendChild(audio);
      audioSection.appendChild(deleteButton);
      recordingItem.appendChild(audioSection);
      
      // 将录音项添加到列表中
      recordingsList.appendChild(recordingItem);
      
      // 设置音频源
      const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
      chunks = [];
      const audioURL = window.URL.createObjectURL(blob);
      audio.src = audioURL;
      
      // 发送到 AssemblyAI 进行转录
      sendToAssemblyAI(blob, API_KEY, recordingItem);
      
      // 删除按钮功能
      deleteButton.onclick = function(e) {
        recordingItem.remove();
        // 如果没有录音项了，重新添加等待消息
        if (recordingsList.children.length === 0) {
          const waitingMessage = document.createElement('div');
          waitingMessage.className = 'waiting-message';
          waitingMessage.textContent = 'Waiting for your voice input...';
          recordingsList.appendChild(waitingMessage);
        }
      };
    };

    mediaRecorder.ondataavailable = function (e) {
      chunks.push(e.data);
    };
  };

  let onError = function (err) {
    console.log("The following error occured: " + err);
  };

  navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);
} else {
  console.log("MediaDevices.getUserMedia() not supported on your browser!");
}

function visualize(stream) {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }

  const source = audioCtx.createMediaStreamSource(stream);

  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  source.connect(analyser);

  draw();

  function draw() {
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    const drawVisual = requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    canvasCtx.fillStyle = 'rgb(200, 200, 200)';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = '#3498db';  // 使用蓝色
    canvasCtx.beginPath();

    const sliceWidth = WIDTH * 1.0 / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = v * HEIGHT / 2;

      if (i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(WIDTH, HEIGHT / 2);
    canvasCtx.stroke();
  }
}

window.onresize = function () {
  canvas.width = mainSection.offsetWidth;
};

window.onresize();
