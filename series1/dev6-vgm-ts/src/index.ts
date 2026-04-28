import { parseVgm } from "@/vgm-parser";
import { createVgmPlayer } from "@/vgm-player";

const player = createVgmPlayer();

async function setupPlayer() {
  const response = await fetch("./tune.vgm");
  if (!response.ok) {
    throw new Error(`HTTP error, status = ${response.status}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());

  const song = parseVgm(bytes);
  const { header } = song;
  console.log(`VGM ${header.version}`);
  console.log(`Data offset 0x${header.dataOffset.toString(16)}`);
  console.log(`AY8910 clock ${header.ay8910Clock} Hz`);

  player.loadSong(song);
}

function setupUi() {
  function addButton(id: string, label: string) {
    const button = document.createElement("button");
    button.id = id;
    button.innerText = label;
    button.className = "button";
    document.body.appendChild(button);
    return button;
  }

  const playButton = addButton("play-button", "play");
  const pauseButton = addButton("pause-button", "pause");
  playButton.style.display = "block";
  pauseButton.style.display = "none";

  playButton.onclick = () => {
    playButton.style.display = "none";
    pauseButton.style.display = "block";
    player.play();
  };

  pauseButton.onclick = () => {
    playButton.style.display = "block";
    pauseButton.style.display = "none";
    player.stop();
  };
}

void setupPlayer();
void setupUi();
