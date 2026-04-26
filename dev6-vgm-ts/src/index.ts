import { AY8910 } from "./ay8910.js";
import { Vgm } from "./vgm.js";

var audioCtx = new window.AudioContext();

(async () => {
  const response = await fetch("./tune.vgm");

  if (!response.ok) {
    throw new Error(`HTTP error, status = ${response.status}`);
  }

  var vgm = new Vgm(new Uint8Array(await response.arrayBuffer()));

  console.log(`VGM ${vgm.getVersion()}`);
  console.log(`Data offset 0x${vgm.getDataOffset().toString(16)}`);
  console.log(`AY8910 clock ${vgm.getAY8910Clock()} Hz`);

  var chip = new AY8910(vgm.getAY8910Clock());

  console.log(`audioCtx.sampleRate ${audioCtx.sampleRate}`);

  var frameCount = vgm.getSamplesCount();

  var myArrayBuffer = audioCtx.createBuffer(1, frameCount, vgm.getSampleRate());

  var nowBuffering = myArrayBuffer.getChannelData(0);

  vgm.fillBuffer(nowBuffering, chip);

  var source = audioCtx.createBufferSource();

  source.buffer = myArrayBuffer;
  source.connect(audioCtx.destination);

  source.loop = true;

  source.start();

  audioCtx.suspend();
})();

function addButton(id: string, label: string) {
  const button = document.createElement("button");
  button.id = id;
  button.innerText = label;
  button.className = "button";
  document.body.appendChild(button);
  return button;
}

var playButton = addButton("play-button", "play");
var pauseButton = addButton("pause-button", "pause");
playButton.style.display = "block";
pauseButton.style.display = "none";

playButton.onclick = () => {
  playButton.style.display = "none";
  pauseButton.style.display = "block";
  audioCtx.resume();
};

pauseButton.onclick = () => {
  playButton.style.display = "block";
  pauseButton.style.display = "none";
  audioCtx.suspend();
};
