import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// We keep main.tsx minimal. Pixel initialization is handled inside the App component or a wrapper via useFacebookPixel hook.
createRoot(document.getElementById("root")!).render(<App />);