declare module "lamejs" {
  interface Mp3EncoderInstance {
    encodeBuffer(left: Int16Array, right?: Int16Array): Int8Array;
    flush(): Int8Array;
  }
  const mod: {
    Mp3Encoder: new (
      channels: number,
      sampleRate: number,
      kbps: number,
    ) => Mp3EncoderInstance;
  };
  export default mod;
}
