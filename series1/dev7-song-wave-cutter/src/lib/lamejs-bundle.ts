import lameBundleSource from "lamejs/lame.all.js?raw";

interface LameJsBundle {
  Mp3Encoder: new (
    channels: number,
    sampleRate: number,
    kbps: number,
  ) => {
    encodeBuffer(left: Int16Array, right?: Int16Array): Int8Array;
    flush(): Int8Array;
  };
}

const loadLameBundle = (): LameJsBundle => {
  const evaluateBundle = new Function(`${lameBundleSource}\nreturn lamejs;`);
  return evaluateBundle() as LameJsBundle;
};

const lameBundle = loadLameBundle();

export const { Mp3Encoder } = lameBundle;