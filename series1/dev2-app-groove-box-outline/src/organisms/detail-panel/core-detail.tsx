import { LabeledSelect } from "../../components/labeled-select";
import { GENERAL_MIDI_PROGRAMS } from "../../general-midi";
import { CORE_PROGRAM_TARGETS } from "../../lib/groovebox-ui";
import type { ProgramTarget } from "../../types";

interface CoreDetailProps {
  programs: Record<ProgramTarget, number>;
  onProgramChange: (target: ProgramTarget, program: number) => void;
}

export function CoreDetail({ programs, onProgramChange }: CoreDetailProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {CORE_PROGRAM_TARGETS.map((target) => (
        <LabeledSelect
          key={target.key}
          label={target.label}
          onChange={(program) => {
            onProgramChange(target.key, Number(program));
          }}
          options={GENERAL_MIDI_PROGRAMS.map((_, index) => index)}
          renderOption={(program) => `${program}: ${GENERAL_MIDI_PROGRAMS[program]}`}
          value={programs[target.key]}
        />
      ))}
    </div>
  );
}