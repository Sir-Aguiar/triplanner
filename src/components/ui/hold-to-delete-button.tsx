import { useCallback, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Vibration,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { ThemedText } from '@/components/themed-text';
import { BORDER_RADIUS, FontFamily, OPACITY, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const HOLD_MS = 1000;
const BORDER_THICKNESS = 3;

type HoldToDeleteButtonProps = {
  label: string;
  disabled?: boolean;
  onHoldComplete: () => void;
  style?: StyleProp<ViewStyle>;
};

export function HoldToDeleteButton({
  label,
  disabled = false,
  onHoldComplete,
  style,
}: HoldToDeleteButtonProps) {
  const theme = useTheme();
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);
  const boxWidth = useSharedValue(0);
  const boxHeight = useSharedValue(0);
  const completedRef = useRef(false);
  const onHoldCompleteRef = useRef(onHoldComplete);
  onHoldCompleteRef.current = onHoldComplete;

  const fireComplete = useCallback(() => {
    if (completedRef.current) {
      return;
    }

    completedRef.current = true;
    Vibration.vibrate(40);
    onHoldCompleteRef.current();
  }, []);

  const resetHold = useCallback(() => {
    if (completedRef.current) {
      return;
    }

    cancelAnimation(progress);
    cancelAnimation(scale);
    progress.value = withTiming(0, { duration: 160, easing: Easing.out(Easing.quad) });
    scale.value = withTiming(1, { duration: 120 });
  }, [progress, scale]);

  useEffect(() => {
    if (!disabled) {
      completedRef.current = false;
      progress.value = 0;
      scale.value = 1;
    }
  }, [disabled, progress, scale]);

  const startHold = () => {
    if (disabled || completedRef.current) {
      return;
    }

    scale.value = withTiming(0.96, { duration: 90 });
    progress.value = withTiming(1, { duration: HOLD_MS, easing: Easing.linear }, (finished) => {
      'worklet';
      if (finished) {
        scheduleOnRN(fireComplete);
      }
    });
  };

  const wrapperStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const topStyle = useAnimatedStyle(() => ({
    width: boxWidth.value * interpolate(progress.value, [0, 0.25], [0, 1], Extrapolation.CLAMP),
  }));

  const rightStyle = useAnimatedStyle(() => ({
    height: boxHeight.value * interpolate(progress.value, [0.25, 0.5], [0, 1], Extrapolation.CLAMP),
  }));

  const bottomStyle = useAnimatedStyle(() => ({
    width: boxWidth.value * interpolate(progress.value, [0.5, 0.75], [0, 1], Extrapolation.CLAMP),
  }));

  const leftStyle = useAnimatedStyle(() => ({
    height: boxHeight.value * interpolate(progress.value, [0.75, 1], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <Animated.View
      onLayout={(event) => {
        boxWidth.value = event.nativeEvent.layout.width;
        boxHeight.value = event.nativeEvent.layout.height;
      }}
      style={[styles.wrap, wrapperStyle, style, disabled && styles.disabled]}>
      <View pointerEvents="none" style={[styles.clip, { borderRadius: BORDER_RADIUS.md }]}>
        <View
          style={[
            styles.track,
            {
              borderColor: theme.destructive,
              borderRadius: BORDER_RADIUS.md,
            },
          ]}
        />
        <Animated.View style={[styles.bar, styles.barTop, { backgroundColor: theme.destructive }, topStyle]} />
        <Animated.View style={[styles.bar, styles.barRight, { backgroundColor: theme.destructive }, rightStyle]} />
        <Animated.View style={[styles.bar, styles.barBottom, { backgroundColor: theme.destructive }, bottomStyle]} />
        <Animated.View style={[styles.bar, styles.barLeft, { backgroundColor: theme.destructive }, leftStyle]} />
      </View>

      <View pointerEvents="none" style={[styles.inner, { backgroundColor: theme.destructive }]}>
        <ThemedText
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          style={styles.label}>
          {label}
        </ThemedText>
      </View>

      <View
        accessible
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint="Mantenha pressionado por 1 segundo para excluir"
        accessibilityState={{ disabled }}
        onStartShouldSetResponder={() => !disabled}
        onResponderTerminationRequest={() => false}
        onResponderGrant={startHold}
        onResponderRelease={resetHold}
        onResponderTerminate={resetHold}
        style={styles.hitArea}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minHeight: 48,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: BORDER_RADIUS.md,
  },
  disabled: {
    opacity: OPACITY.disabled,
  },
  clip: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  track: {
    ...StyleSheet.absoluteFill,
    borderWidth: BORDER_THICKNESS,
    opacity: 0.28,
  },
  bar: {
    position: 'absolute',
  },
  barTop: {
    top: 0,
    left: 0,
    height: BORDER_THICKNESS,
  },
  barRight: {
    top: 0,
    right: 0,
    width: BORDER_THICKNESS,
  },
  barBottom: {
    right: 0,
    bottom: 0,
    height: BORDER_THICKNESS,
  },
  barLeft: {
    left: 0,
    bottom: 0,
    width: BORDER_THICKNESS,
  },
  inner: {
    flex: 1,
    minHeight: 48 - BORDER_THICKNESS * 2,
    margin: BORDER_THICKNESS,
    borderRadius: BORDER_RADIUS.md - 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  hitArea: {
    ...StyleSheet.absoluteFill,
  },
  label: {
    fontFamily: FontFamily.sansSemibold,
    fontSize: TYPOGRAPHY.sizes.sm,
    lineHeight: TYPOGRAPHY.lineHeights.sm,
    textAlign: 'center',
    width: '100%',
    color: '#ffffff',
  },
});
