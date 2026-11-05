import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** From Android 11 React Native leaves the navigation bar out of the keyboard height it reports. */
const KEYBOARD_EXCLUDES_NAV_BAR = Platform.OS === 'android' && Platform.Version >= 30;

/**
 * How much bottom padding a full-height frame needs so its content ends above the keyboard.
 *
 * The lift is the part of the keyboard the window did not already make room for: the keyboard's height
 * minus how much the frame itself shrank. That is zero when the window resized for the keyboard and the
 * full keyboard height when it did not (Android is edge-to-edge since SDK 54), so the two never add up
 * into a big gap or leave content under the keyboard, and it returns to zero when the keyboard closes.
 * Only heights are compared, so status-bar or navigation-bar offsets never skew it.
 */
export function useKeyboardLift() {
  const { bottom: navBar } = useSafeAreaInsets();
  const keyboardHeight = useRef<number | null>(null);
  // Frame height with the keyboard closed, and its latest height.
  const rest = useRef<number | null>(null);
  const current = useRef<number | null>(null);
  const [lift, setLift] = useState(0);

  const update = useCallback(() => {
    const keyboard = keyboardHeight.current;
    if (keyboard === null || rest.current === null || current.current === null) return setLift(0);
    const shrunk = Math.max(0, rest.current - current.current);
    setLift(Math.max(0, Math.round(keyboard - shrunk)));
  }, []);

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (event) => {
      keyboardHeight.current = event.endCoordinates.height + (KEYBOARD_EXCLUDES_NAV_BAR ? navBar : 0);
      update();
    });
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      keyboardHeight.current = null;
      setLift(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [navBar, update]);

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      current.current = event.nativeEvent.layout.height;
      if (keyboardHeight.current === null) rest.current = current.current;
      update();
    },
    [update],
  );

  return { lift, onLayout };
}
