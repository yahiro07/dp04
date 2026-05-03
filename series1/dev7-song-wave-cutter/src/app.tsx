import { OffsetAdjuster } from "./components/offset-adjuster";
import { TopBar } from "./components/top-bar";
import { WaveformGrid } from "./components/waveform-grid";
import { configs } from "./configs";
import { createAppController } from "./controllers/app-controller";
import { getMaxDraftOffsetSamples } from "./lib/audio-utils";

export const App = () => {
  const { state, actions } = createAppController();

  const draftOffsetRatio = () => {
    if (!state.audioClip) {
      return 0;
    }

    const maxOffsetSamples = getMaxDraftOffsetSamples(state.audioClip);
    return maxOffsetSamples > 0
      ? state.draftOffsetSamples / maxOffsetSamples
      : 0;
  };

  const appliedSummary = () => {
    if (state.appliedBpm === null || state.appliedOffsetSamples === null) {
      return "apply to build the 64-bar grid";
    }

    return `offset ${state.appliedOffsetSamples} samples / bpm ${state.appliedBpm}`;
  };

  const selectionSummary = () => {
    if (!state.selection) {
      return "no selection";
    }

    return `bar ${state.selection.startBar + 1} - ${state.selection.startBar + state.selection.length}`;
  };

  return (
    <main class="app-shell flex-v">
      <TopBar
        bpm={state.bpm}
        fileName={state.audioClip?.fileName ?? null}
        isSongPlaying={state.isSongPlaying}
        isLoading={state.isLoading}
        onAdjustBpm={actions.adjustBpm}
        onLoadFile={actions.loadAudioFile}
        onTapBpm={actions.tapBpm}
        onToggleSongPlayback={actions.toggleSongPlayback}
      />

      <OffsetAdjuster
        beatLineRatios={state.previewBeatLineRatios}
        disabled={!state.audioClip}
        draftOffsetRatio={draftOffsetRatio()}
        draftOffsetSamples={state.draftOffsetSamples}
        envelope={state.previewEnvelope}
        onApply={actions.applyDraftSettings}
        onChangeOffsetRatio={actions.setDraftOffsetFromRatio}
      />

      <section class="panel flex-v">
        <div class="panel-header flex-ha">
          <div class="flex-v gap-1">
            <span class="label-text">waveform view</span>
            <span class="meta-text">{appliedSummary()}</span>
            <span class="meta-text">selection: {selectionSummary()}</span>
            <span class="meta-text">
              drag right to expand 1 / 2 / 4 bars, tap for one-shot, hold for
              loop
            </span>
          </div>
          <div class="side-stack flex-v">
            <button
              class="action-button"
              disabled={!state.selection || state.appliedBpm === null}
              onClick={actions.exportSelection}
              type="button"
            >
              export
            </button>
            <div class="meta-text">
              showing {configs.displayMaxBars} bars from the applied song offset
            </div>
          </div>
        </div>
        <div class="panel-body flex-v">
          {state.waveformBars.length > 0 ? (
            <WaveformGrid
              disabled={state.appliedBpm === null}
              onPlaySelectionOnce={actions.playSelectionOnce}
              onSelectRange={actions.selectRange}
              onStartSelectionLoop={actions.startSelectionLoop}
              onStopPlayback={actions.stopPlayback}
              selection={state.selection}
              waveformBars={state.waveformBars}
            />
          ) : (
            <div class="placeholder">
              audio load and apply are required before the main waveform is
              shown
            </div>
          )}
          <div class="status-text">{state.errorMessage}</div>
        </div>
      </section>
    </main>
  );
};
