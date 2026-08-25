import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Screen } from 'react-native-screens';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { usePathname } from 'expo-router';
import type { defaultTabsSlotRender } from 'expo-router/ui';

const SLIDE_MS = 320;
const SLIDE_EASING = Easing.out(Easing.cubic);

type TabTransitionValue = {
  currentIndex: number;
  previousIndex: number;
};

const TabTransitionContext = createContext<TabTransitionValue>({
  currentIndex: 0,
  previousIndex: 0,
});

function tabIndexFromPath(pathname: string): number {
  if (pathname.includes('/viagens')) {
    return 1;
  }
  if (pathname.includes('/perfil')) {
    return 2;
  }
  return 0;
}

export function TabTransitionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const currentIndex = tabIndexFromPath(pathname);
  const [transition, setTransition] = useState<TabTransitionValue>({
    currentIndex,
    previousIndex: currentIndex,
  });

  useEffect(() => {
    setTransition((prev) => {
      if (prev.currentIndex === currentIndex) {
        return prev;
      }
      return { currentIndex, previousIndex: prev.currentIndex };
    });
  }, [currentIndex]);

  return (
    <TabTransitionContext.Provider value={transition}>{children}</TabTransitionContext.Provider>
  );
}

type SlidingContentProps = {
  isFocused: boolean;
  index: number;
  children: ReactNode;
};

function SlidingContent({ isFocused, index, children }: SlidingContentProps) {
  const { width } = useWindowDimensions();
  const { currentIndex, previousIndex } = useContext(TabTransitionContext);
  const translateX = useSharedValue(isFocused ? 0 : width);
  const hasMounted = useRef(false);
  const wasFocused = useRef(isFocused);

  useEffect(() => {
    const goingForward = currentIndex >= previousIndex;

    if (!hasMounted.current) {
      hasMounted.current = true;
      translateX.value = isFocused ? 0 : index > currentIndex ? width : -width;
      wasFocused.current = isFocused;
      return;
    }

    if (isFocused && !wasFocused.current) {
      translateX.value = goingForward ? width : -width;
      translateX.value = withTiming(0, { duration: SLIDE_MS, easing: SLIDE_EASING });
    } else if (!isFocused && wasFocused.current) {
      translateX.value = withTiming(goingForward ? -width : width, {
        duration: SLIDE_MS,
        easing: SLIDE_EASING,
      });
    } else if (!isFocused) {
      translateX.value = index > currentIndex ? width : -width;
    }

    wasFocused.current = isFocused;
  }, [currentIndex, index, isFocused, previousIndex, translateX, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      pointerEvents={isFocused ? 'auto' : 'none'}
      style={[styles.content, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

/**
 * Precisa retornar `Screen` (RNScreens) como filho direto do ScreenContainer.
 * A animação fica *dentro* do Screen.
 */
export const renderSlidingTab: typeof defaultTabsSlotRender = (
  descriptor,
  { isFocused, loaded, index, detachInactiveScreens },
) => {
  const { lazy = true, unmountOnBlur, freezeOnBlur } = descriptor.options;

  if (unmountOnBlur && !isFocused) {
    return null;
  }

  if (lazy && !loaded && !isFocused) {
    return null;
  }

  return (
    <Screen
      key={descriptor.route.key}
      enabled={detachInactiveScreens}
      activityState={isFocused ? 2 : 1}
      freezeOnBlur={freezeOnBlur}
      pointerEvents={isFocused ? 'auto' : 'none'}
      style={[styles.screen, isFocused ? styles.focused : styles.unfocused]}>
      <SlidingContent isFocused={isFocused} index={index}>
        {descriptor.render()}
      </SlidingContent>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  focused: {
    zIndex: 2,
  },
  unfocused: {
    zIndex: 1,
  },
  content: {
    flex: 1,
  },
});
