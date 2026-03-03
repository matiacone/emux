import { createCliRenderer } from "@opentui/core";
import { createRoot, useKeyboard, useRenderer } from "@opentui/react";

function Sidebar() {
  const renderer = useRenderer();

  useKeyboard((key) => {
    if (key.name === "escape") {
      renderer.destroy();
    }
  });

  return (
    <box
      flexDirection="column"
      width="100%"
      height="100%"
      border
      borderStyle="rounded"
      borderColor="#565f89"
    >
      <box paddingX={1}>
        <text>
          <strong fg="#7aa2f7">emux</strong>
        </text>
      </box>

      <box flexGrow={1} justifyContent="center" alignItems="center">
        <text fg="#565f89">Press 'a' to add a repo</text>
      </box>
    </box>
  );
}

async function main() {
  const renderer = await createCliRenderer({
    exitOnCtrlC: false,
  });

  const root = createRoot(renderer);
  root.render(<Sidebar />);
}

main();
