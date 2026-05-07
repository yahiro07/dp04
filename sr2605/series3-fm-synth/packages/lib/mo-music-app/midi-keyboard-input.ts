export type MidiKeyboardInputEvent = {
  type: "note";
  noteNumber: number;
  velocity: number; //0 for note off
};
export async function setupMidiKeyboardInput(options: {
  connectionStateCallback?: (connected: boolean) => void;
  eventCallback?: (e: MidiKeyboardInputEvent) => void;
  noteCallback?: (noteNumber: number, velocity: number) => void;
}): Promise<(() => void) | undefined> {
  const midiAccess = await navigator.requestMIDIAccess();
  if (!midiAccess) return;
  console.log("midi inputs", Array.from(midiAccess.inputs.values()).length);
  const midiInput = Array.from(midiAccess.inputs.values())[0];
  if (!midiInput) return;

  const handlers = {
    onStateChange() {
      const isConnected = midiInput.connection === "open";
      options.connectionStateCallback?.(isConnected);
      console.log(
        isConnected
          ? `midi input opened: ${midiInput.name}`
          : `midi input closed`,
      );
    },
    onMidiMessage(e: MIDIMessageEvent) {
      if (!e.data) return;
      const [status, data1, data2] = e.data;
      const cmd = status & 0xf0;
      if (cmd === 0x90 && data2 > 0) {
        const [noteNumber, velocity] = [data1, data2];
        options.noteCallback?.(noteNumber, velocity);
        options.eventCallback?.({ type: "note", noteNumber, velocity });
      } else if (cmd === 0x80 || (cmd === 0x90 && data2 === 0)) {
        const noteNumber = data1;
        options.noteCallback?.(noteNumber, 0);
        options.eventCallback?.({ type: "note", noteNumber, velocity: 0 });
      } else {
        console.log(status, data1, data2);
      }
    },
  };

  midiInput.onstatechange = handlers.onStateChange;
  midiInput.onmidimessage = handlers.onMidiMessage;

  return () => {
    midiInput.onstatechange = null;
    midiInput.onmidimessage = null;
  };
}
