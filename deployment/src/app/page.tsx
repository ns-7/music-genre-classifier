"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    // Immediately redirect to the original site without delay
    window.location.href = "/eidcoin/index.html";
  }, []);

  // Return null to prevent any flash of content
  return null;
}
}
