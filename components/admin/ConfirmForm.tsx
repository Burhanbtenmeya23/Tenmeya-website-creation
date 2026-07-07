"use client";

import type { ReactNode } from "react";

export function ConfirmForm({
  action,
  confirmMessage,
  children,
}: {
  action: () => Promise<void>;
  confirmMessage: string;
  children: ReactNode;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </form>
  );
}
