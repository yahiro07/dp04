import { configs } from "../configs";

interface TopBarProps {
  bpm: number;
  fileName: string | null;
  isSongPlaying: boolean;
  isLoading: boolean;
  onLoadFile: (file: File) => void;
  onAdjustBpm: (deltaSteps: number) => void;
  onTapBpm: () => void;
  onToggleSongPlayback: () => void;
}

export const TopBar = (props: TopBarProps) => {
  let fileInputElement: HTMLInputElement | undefined;
  let dragPointerId: number | null = null;
  let dragLastX = 0;
  let dragLastY = 0;
  let dragCarry = 0;

  const handleFileChange = (event: Event) => {
    const target = event.currentTarget as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) {
      return;
    }

    props.onLoadFile(file);
    target.value = "";
  };

  const handleBpmPointerDown = (event: PointerEvent) => {
    const targetElement = event.currentTarget as HTMLDivElement | null;
    if (!targetElement) {
      return;
    }

    dragPointerId = event.pointerId;
    dragLastX = event.clientX;
    dragLastY = event.clientY;
    dragCarry = 0;
    targetElement.setPointerCapture(event.pointerId);
  };

  const handleBpmPointerMove = (event: PointerEvent) => {
    if (dragPointerId !== event.pointerId) {
      return;
    }

    const deltaX = -(event.clientX - dragLastX);
    const deltaY = dragLastY - event.clientY;

    dragCarry += deltaX + deltaY;
    dragLastX = event.clientX;
    dragLastY = event.clientY;

    const stepThreshold = configs.bpmDragPixelsPerStep;
    const resolvedSteps =
      dragCarry > 0
        ? Math.floor(dragCarry / stepThreshold)
        : Math.ceil(dragCarry / stepThreshold);

    if (!resolvedSteps) {
      return;
    }

    dragCarry -= resolvedSteps * stepThreshold;
    props.onAdjustBpm(resolvedSteps);
  };

  const clearBpmDrag = (event: PointerEvent) => {
    const targetElement = event.currentTarget as HTMLDivElement | null;
    if (dragPointerId === event.pointerId) {
      dragPointerId = null;
      dragLastX = 0;
      dragLastY = 0;
      dragCarry = 0;
      targetElement?.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <section class="panel top-bar flex-ha">
      <button
        class="action-button"
        disabled={props.isLoading}
        onClick={() => fileInputElement?.click()}
        type="button"
      >
        {props.isLoading ? "loading" : "load"}
      </button>
      <input
        accept=".wav,.mp3,audio/mpeg,audio/wav"
        class="hidden"
        onChange={handleFileChange}
        ref={fileInputElement}
        type="file"
      />
      <div class="flex-v gap-1">
        <span class="label-text">bpm</span>
        <div
          class="value-chip"
          onPointerCancel={clearBpmDrag}
          onPointerDown={handleBpmPointerDown}
          onPointerMove={handleBpmPointerMove}
          onPointerUp={clearBpmDrag}
        >
          <strong>{props.bpm}</strong>
          <span>drag vertical</span>
        </div>
      </div>
      <button
        class={`action-button ${props.isSongPlaying ? "is-active" : "secondary-button"}`}
        disabled={!props.fileName}
        onClick={props.onToggleSongPlayback}
        type="button"
      >
        {props.isSongPlaying ? "stop" : "play"}
      </button>
      <button
        class="action-button secondary-button"
        onClick={props.onTapBpm}
        type="button"
      >
        tap
      </button>
      <div class="meta-text">{props.fileName ?? "no file loaded"}</div>
    </section>
  );
};
