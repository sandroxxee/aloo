import AlooApp from "./aloo/App";
import "./aloo/index.css";
import { ToastProvider } from "./aloo/components/Toast";

export default function App() {
  return (
    <ToastProvider>
      <div className="asset-intelligence-shell">
        <AlooApp />
      </div>
    </ToastProvider>
  );
}
