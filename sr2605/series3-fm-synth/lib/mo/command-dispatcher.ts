export type CommandDispatcher<T extends { type: string }> = {
  apply: (command: T) => void;
};

export function createCommandDispatcher<T extends { type: string }>(
  handlers: { [K in T["type"]]: (command: T & { type: K }) => void },
): CommandDispatcher<T> {
  return {
    apply: (command) => {
      const handler = handlers[command.type as T["type"]];
      if (handler) {
        handler(command);
      }
    },
  };
}
