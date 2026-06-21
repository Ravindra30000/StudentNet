"use client";

import * as React from "react";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";

export default function PageProgress() {
  return (
    <ProgressBar
      height="3px"
      color="#163832"
      options={{ showSpinner: false }}
      shallowRouting
    />
  );
}
