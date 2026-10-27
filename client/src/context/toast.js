import { createContext, useContext } from "react";

export const ToastContext = createContext(() => {});

// const toast = useToast();  toast("Voucher approved")  /  toast("Failed", "error")
export function useToast() {
  return useContext(ToastContext);
}
