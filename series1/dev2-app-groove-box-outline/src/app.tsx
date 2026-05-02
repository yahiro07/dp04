import { GrooveboxProvider } from "./context/groovebox-context";
import { GrooveboxScreen } from "./organisms/groovebox-screen";

export function App() {
  return (
    <GrooveboxProvider>
      <GrooveboxScreen />
    </GrooveboxProvider>
  );
}
