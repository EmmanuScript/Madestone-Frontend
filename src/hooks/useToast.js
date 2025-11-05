import { useState, useCallback } from "react";

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((currentToasts) => [...currentToasts, { id, message, type }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id)
    );
  }, []);

  const success = useCallback(
    (message) => addToast(message, "success"),
    [addToast]
  );
  const error = useCallback(
    (message) => addToast(message, "error"),
    [addToast]
  );
  const info = useCallback((message) => addToast(message, "info"), [addToast]);

  return {
    toasts,
    success,
    error,
    info,
    removeToast,
  };
}
