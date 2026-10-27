import { useCallback, useRef, useState } from "react";
import { ToastContext } from "../context/toast";
import Icon from "./Icon";

const ICON = { success: "check", error: "x", info: "activity" };
const SHOW_MS = 4000;

// small pop-up messages at the bottom right, they hide after 4 seconds
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const close = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const show = useCallback(
    (text, type = "success") => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-3), { id, text, type }]); // keep at most 4
      setTimeout(() => close(id), SHOW_MS);
    },
    [close]
  );

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={"toast toast-" + t.type}>
            <Icon name={ICON[t.type]} />
            <span className="toast-text">{t.text}</span>
            <button type="button" aria-label="Close message" onClick={() => close(t.id)}>
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
