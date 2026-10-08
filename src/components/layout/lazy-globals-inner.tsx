"use client";

import { useEffect } from "react";
import { CommandPalette } from "./command-palette";
import { KeyboardShortcuts } from "./keyboard-shortcuts";

/** Loaded lazily by <LazyGlobals/>. Children's effects run first, so `onMounted` fires once their key listeners exist. */
export default function LazyGlobalsInner({ onMounted }: { onMounted: () => void }) {
  useEffect(() => {
    onMounted();
  }, [onMounted]);
  return (
    <>
      <KeyboardShortcuts />
      <CommandPalette />
    </>
  );
}
