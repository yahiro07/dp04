import { SetStoreFunction } from "solid-js/store";

export type StoreMutations<T> = {
  [K in keyof T as `set${Capitalize<K & string>}`]: (
    value: T[K] | ((prev: T[K]) => T[K]),
  ) => void;
} & {
//   [K in keyof T as T[K] extends object
//     ? `produce${Capitalize<K & string>}`
//     : never]: (fn: (draft: T[K]) => void) => void;
// } & {
//   [K in keyof T as T[K] extends object
//     ? `patch${Capitalize<K & string>}`
//     : never]: (
//     input:
//       | Partial<Extract<T[K], object>>
//       | ((prev: T[K]) => Partial<Extract<T[K], object>>),
//   ) => void;
// } & {
//   [K in keyof T as T[K] extends boolean
//     ? `toggle${Capitalize<K & string>}`
//     : never]: () => void;
// } & {
  assigns: (attrs: Partial<T>) => void;
};


 function capitalizeFirstLetter(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}


export function createStoreMutations<T extends object>(setStore: SetStoreFunction<T>, initialState: T): StoreMutations<T>{
  type K = Extract<keyof T, string>;
  type V = T[K];

  const mutations = {} as StoreMutations<T>;
  const _mutations = mutations as any;
  for(const _key in initialState){
    const key = _key as K;
    const suffix = capitalizeFirstLetter(key);
    _mutations[`set${suffix}`] = (value: V | ((prev: V) => V)) => {
      setStore(key as any, value);
    } 
  }
  mutations.assigns = (attrs: Partial<T>) => {
    for(const key in attrs){
      setStore(key as any, attrs[key])
    }
  }
  return mutations;
}