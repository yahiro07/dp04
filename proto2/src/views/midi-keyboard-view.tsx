import { useMidiKeyboardPresenter } from "@/presenters/use-midi-keyboard-presenter";

export const MidiKeyboardView = () => {
  const minNote = 48;
  const noteNum = 32;
  const { connected, holdingNotes } = useMidiKeyboardPresenter();
  return (
    <div
      css={{
        width: "600px",
        height: "100px",
        border: "solid 1px #888",
      }}
    >
      <p>Connected: {connected ? "yes" : "no"}</p>
      <p>Holding notes: {holdingNotes.join(", ")}</p>
    </div>
  );
};
