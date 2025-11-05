import React, { createContext, useContext } from "react";
import { useToast } from "../hooks/useToast";
import Toast from "./Toast";

const ToastContext = createContext(null);

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToastContext must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }) {
  const toastManager = useToast();

  return (
    <ToastContext.Provider value={toastManager}>
      {children}
      <div className="toast-container">
        {toastManager.toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => toastManager.removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
