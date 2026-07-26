import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useReducer } from 'react';
import { Platform } from 'react-native';

type UseStateHook<T> = [[boolean, T | null], (value: T | null) => void];

function useAsyncState<T>(initialValue: [boolean, T | null] = [true, null]): UseStateHook<T> {
  return useReducer(
    (_state: [boolean, T | null], action: T | null = null): [boolean, T | null] => [false, action],
    initialValue,
  ) as UseStateHook<T>;
}

async function setStorageItemAsync(key: string, value: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (value === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Local storage is unavailable:', error);
    }
    return;
  }

  if (value == null) {
    await SecureStore.deleteItemAsync(key);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

export function useStorageState(key: string): UseStateHook<string> {
  const [state, setState] = useAsyncState<string>();

  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        if (typeof localStorage !== 'undefined') {
          setState(localStorage.getItem(key));
        }
      } catch (error) {
        console.error('Local storage is unavailable:', error);
        setState(null);
      }
      return;
    }

    SecureStore.getItemAsync(key)
      .then((value) => setState(value))
      .catch((error) => {
        console.error('SecureStore unavailable:', error);
        setState(null);
      });
  }, [key]);

  const setValue = useCallback(
    (value: string | null) => {
      setState(value);
      void setStorageItemAsync(key, value);
    },
    [key],
  );

  return [state, setValue];
}
