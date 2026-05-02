interface MidiInputServiceOptions {
  onAvailabilityChange: (available: boolean) => void;
  onNoteChange: (note: number, enabled: boolean) => void;
}

export function startMidiInputService({
  onAvailabilityChange,
  onNoteChange,
}: MidiInputServiceOptions) {
  if (typeof navigator === "undefined" || !("requestMIDIAccess" in navigator)) {
    onAvailabilityChange(false);
    return () => undefined;
  }

  let disposed = false;
  let cleanupInputs = () => undefined;

  navigator
    .requestMIDIAccess()
    .then((midiAccess) => {
      if (disposed) {
        return;
      }

      const bindInputs = () => {
        cleanupInputs();
        const inputs = Array.from(midiAccess.inputs.values());
        onAvailabilityChange(inputs.length > 0);

        for (const input of inputs) {
          input.onmidimessage = (event) => {
            if (!event.data) {
              return;
            }

            const [status, note, velocity] = event.data;
            const messageType = status & 0xf0;
            const isNoteOn = messageType === 0x90 && velocity > 0;
            const isNoteOff =
              messageType === 0x80 || (messageType === 0x90 && velocity === 0);

            if (!isNoteOn && !isNoteOff) {
              return;
            }

            onNoteChange(note, isNoteOn);
          };
        }

        cleanupInputs = () => {
          for (const input of inputs) {
            input.onmidimessage = null;
          }
        };
      };

      bindInputs();
      midiAccess.onstatechange = () => {
        if (!disposed) {
          bindInputs();
        }
      };
    })
    .catch(() => {
      onAvailabilityChange(false);
    });

  return () => {
    disposed = true;
    cleanupInputs();
  };
}
