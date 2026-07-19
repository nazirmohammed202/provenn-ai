"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "border border-[#dbe8e4] bg-white text-[#102321]",
        },
      }}
    />
  );
}
