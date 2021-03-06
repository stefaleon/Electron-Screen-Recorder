const { writeFile } = require('fs');
const { desktopCapturer, remote } = require('electron');

const { Menu, dialog } = remote;

const videoElement = document.querySelector('video');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const videoSelectBtn = document.getElementById('videoSelectBtn');

videoSelectBtn.onclick = getVideoSources;
startBtn.onclick = e => {
  if (mediaRecorder) {
    mediaRecorder.start();
    startBtn.classList.add('is-danger');
    startBtn.innerText = 'Recording';
  } else {
    console.log('%cVIDEO SOURCE HAS NOT BEEN SELECTED YET', 'color: red');
  }
};
stopBtn.onclick = e => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    startBtn.classList.remove('is-danger');
    startBtn.innerText = 'Start';
  } else if (mediaRecorder && mediaRecorder.state === 'inactive') {
    console.log('%cmediaRecorder IS INACTIVE', 'color: red');
  } else {
    console.log('%cmediaRecorder HAS NOT STARTED', 'color: red');
  }
};

async function getVideoSources() {
  const inputSources = await desktopCapturer.getSources({
    types: ['window', 'screen']
  });

  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map(source => {
      return {
        label: source.name,
        click: () => selectSource(source)
      };
    })
  );

  videoOptionsMenu.popup();
}

let mediaRecorder; // MediaRecorder instance to capture footage
const recordedChunks = [];

async function selectSource(source) {
  // console.log(source);

  videoSelectBtn.innerText = source.name;

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: source.id
      }
    }
  };

  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  videoElement.srcObject = stream;
  videoElement.play();

  const options = { mimeType: 'video/webm; codecs=vp9' };
  mediaRecorder = new MediaRecorder(stream, options);

  mediaRecorder.ondataavailable = handleAvailableData;
  mediaRecorder.onstop = handleStop;
}

function handleAvailableData(e) {
  console.log('video data available');
  recordedChunks.push(e.data);
}

async function handleStop(e) {
  const blob = new Blob(recordedChunks, {
    type: 'video/webm; codecs=vp9'
  });

  const buffer = Buffer.from(await blob.arrayBuffer());

  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: 'Save video',
    defaultPath: `cap-${Date.now()}.webm`
  });

  // console.log(filePath);
  if (filePath) {
    writeFile(filePath, buffer, () => console.log('video saved successfully!'));
  }
}
