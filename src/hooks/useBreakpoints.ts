import { useEffect, useState } from "react";
import { useWindowDimensions } from "react-native";

/**
 * Kembalikan info lebar layar dengan mounted guard agar SSR/hydration konsisten.
 * Sebelum mounted, kembalikan nilai default mobile (375px).
 */
export function useBreakpoints() {
  const { width } = useWindowDimensions();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const w = mounted ? width : 375;
  return {
    w,
    isMobile:    w < 480,
    isTablet:    w >= 600,
    showSidebar: w >= 768,
  };
}
