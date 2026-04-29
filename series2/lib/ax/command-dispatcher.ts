export function createCommandDispatcher<T extends { type: string }>(
  handlers: { [K in T["type"]]: (command: T & { type: K }) => void },
): { apply: (command: T) => void } {
  return {
    apply: (command) => {
      const handler = handlers[command.type as T["type"]];
      if (handler) {
        handler(command);
      }
    },
  };
}
