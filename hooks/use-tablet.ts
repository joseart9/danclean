import * as React from "react";

const TABLET_MIN_BREAKPOINT = 768;
const TABLET_MAX_BREAKPOINT = 1024;

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(
    undefined
  );

  React.useEffect(() => {
    const checkIsTablet = () => {
      const width = window.innerWidth;
      setIsTablet(
        width >= TABLET_MIN_BREAKPOINT && width < TABLET_MAX_BREAKPOINT
      );
    };

    checkIsTablet();
    window.addEventListener("resize", checkIsTablet);
    return () => window.removeEventListener("resize", checkIsTablet);
  }, []);

  return !!isTablet;
}
