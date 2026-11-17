import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { isSiteCurtainVisible } from "./curtain";

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // A route change puts the curtain up first, so jump instantly: a smooth
    // scroll would still be moving when the wave begins to reveal the page.
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: isSiteCurtainVisible() ? "auto" : "smooth",
    });
  }, [pathname]);

  return null;
}