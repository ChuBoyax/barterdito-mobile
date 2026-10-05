import AsyncStorage from '@react-native-async-storage/async-storage';


export const storageKeys = {
  theme: 'barterdito-theme',
  onboarded: 'barterdito-onboarded',
  demoAuth: 'barterdito-demo-auth',
  postDraft: 'barterdito-post-draft',
} as const;

export async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    
  }
}

export async function removeKey(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
  
  }
}
