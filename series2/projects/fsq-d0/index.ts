import { foo } from "@lib/ax/utils";
import { WorkletSynthesizer } from "spessasynth_lib";

foo();

const workletUrl = new URL(
	"spessasynth_lib/dist/spessasynth_processor.min.js",
	import.meta.url,
);

const sfont = await (await fetch("/soundfonts/A320U.sf2")).arrayBuffer();
const ctx = new AudioContext();
await ctx.audioWorklet.addModule(workletUrl);
const synth = new WorkletSynthesizer(ctx);
synth.connect(ctx.destination);
await synth.soundBankManager.addSoundBank(sfont, "main");
await synth.isReady;

const button = document.createElement("button");
button.id = "button";
button.textContent = "Play note";
document.body.appendChild(button);
button.onclick = async () => {
	console.log("Playing note...");
	await ctx.resume();
	synth.programChange(0, 48); // strings ensemble
	synth.noteOn(0, 52, 127);
};
