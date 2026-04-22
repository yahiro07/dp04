export type MidiKeyboardInputEvent = {
  type: "note";
  noteNumber: number;
  velocity: number; //0 for note off
};
export async function setupMidiKeyboardInput(
  callback: (e: MidiKeyboardInputEvent) => void,
) {
  const midiAccess = await navigator.requestMIDIAccess();
  if (!midiAccess) return;
  console.log("midi inputs", Array.from(midiAccess.inputs.values()).length);
  const midiInput = Array.from(midiAccess.inputs.values())[0];
  if (!midiInput) return;

  midiInput.onmidimessage = (e) => {
    if (!e.data) return;
    const [status, data1, data2] = e.data;
    const cmd = status & 0xf0;
    if (cmd === 0x90 && data2 > 0) {
      const [noteNumber, velocity] = [data1, data2];
      callback({ type: "note", noteNumber, velocity });
    } else if (cmd === 0x80 || (cmd === 0x90 && data2 === 0)) {
      const noteNumber = data1;
      callback({ type: "note", noteNumber, velocity: 0 });
    } else {
      console.log(status, data1, data2);
    }
  };
}
