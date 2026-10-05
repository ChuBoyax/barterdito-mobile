import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { AlertCircle, ChevronRight, Eye, EyeOff, KeyRound, Lock, LogIn, Mail, User, UserPlus, X } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, IconButton, IconTile, PressableScale, SegmentedControl, TextField } from '@/components/ui';
import { useAuth, useTheme, useToast } from '@/providers';
import { authService } from '@/services';
import { elevation, fonts, maxFontScale } from '@/theme';
import { errorMessage } from '@/utils/format';

type Mode = 'login' | 'signup';

export default function LoginScreen() {
  const params = useLocalSearchParams<{ mode?: Mode }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const showToast = useToast();
  const [mode, setMode] = useState<Mode>(params.mode === 'signup' ? 'signup' : 'login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  async function submit(credentials = { email, password }) {
    setError('');
    if (!credentials.email.includes('@')) return setError('Enter a valid email address');
    if (!credentials.password) return setError('Enter your password');
    if (mode === 'signup' && !fullName.trim()) return setError('Enter your full name');
    setSubmitting(true);
    try {
      const user = mode === 'signup' ? await signUp({ ...credentials, fullName }) : await signIn(credentials);
      showToast(mode === 'signup' ? 'Welcome to Barterdito!' : `Welcome back, ${user.fullName.split(' ')[0]}!`);
      close();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  function signInWithDemo(account: { email: string; password: string }) {
    setMode('login');
    setEmail(account.email);
    setPassword(account.password);
    void submit(account);
  }

  async function google() {
    setSubmitting(true);
    try {
      await signInWithGoogle();
      showToast('Signed in with Google');
      close();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.top}>
            <IconButton icon={X} label="Close" size={18} onPress={close} />
          </View>

          <Animated.View entering={FadeInUp.duration(600)} style={styles.brand}>
            <View style={[styles.logoGlow, { backgroundColor: colors.orangeSoft }]}>
              <Image source={require('@/assets/images/barterdito-mark.jpg')} style={styles.logo} />
            </View>
            <AppText variant="display" align="center">
              {mode === 'login' ? 'Welcome back,\n' : 'Join the\n'}
              <AppText variant="display" color="orange">
                {mode === 'login' ? 'ka-barter.' : 'swap club.'}
              </AppText>
            </AppText>
            <AppText variant="body" color="muted" align="center" style={styles.lead}>
              {mode === 'login'
                ? 'Sign in to send offers, save finds, and chat with traders.'
                : 'Create an account and give useful things a second story.'}
            </AppText>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).duration(600)}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }, elevation(2, colors)]}>
              <SegmentedControl<Mode>
                value={mode}
                onChange={setMode}
                segments={[
                  { value: 'login', label: 'Log in' },
                  { value: 'signup', label: 'Sign up' },
                ]}
              />
              {mode === 'signup' ? (
                <TextField label="Full name" icon={User} value={fullName} onChangeText={setFullName} placeholder="Juan Dela Cruz" autoComplete="name" />
              ) : null}
              <TextField
                label="Email address"
                icon={Mail}
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setError('');
                }}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              <TextField
                label="Password"
                icon={Lock}
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  setError('');
                }}
                placeholder="At least 8 characters"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                right={
                  <Pressable accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                    {showPassword ? <EyeOff size={18} color={colors.muted} /> : <Eye size={18} color={colors.muted} />}
                  </Pressable>
                }
              />
              {error ? (
                <View accessibilityLiveRegion="polite" style={[styles.error, { backgroundColor: colors.redSoft }]}>
                  <AlertCircle size={16} color={colors.red} />
                  <AppText variant="small" color="red" weight="semibold" style={styles.flex}>
                    {error}
                  </AppText>
                </View>
              ) : null}
              <Button
                label={mode === 'login' ? 'Sign in' : 'Create account'}
                icon={mode === 'login' ? LogIn : UserPlus}
                loading={submitting}
                onPress={() => void submit()}
              />
              <View style={styles.divider}>
                <View style={[styles.line, { backgroundColor: colors.line }]} />
                <AppText variant="caption">or continue with</AppText>
                <View style={[styles.line, { backgroundColor: colors.line }]} />
              </View>
              <Pressable
                accessibilityRole="button"
                disabled={submitting}
                onPress={() => void google()}
                style={({ pressed }) => [styles.google, { backgroundColor: colors.surface, borderColor: colors.hairline }, pressed && { opacity: 0.8 }]}>
                <Text maxFontSizeMultiplier={maxFontScale} style={[styles.g, { color: colors.blue }]}>G</Text>
                <AppText variant="h3">Continue with Google</AppText>
              </Pressable>
            </View>
          </Animated.View>

          <View style={[styles.demo, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <View style={styles.demoHead}>
              <IconTile icon={KeyRound} size={34} />
              <View style={styles.flex}>
                <AppText variant="h3">Demo accounts</AppText>
                <AppText variant="caption">Tap one to sign in instantly</AppText>
              </View>
            </View>
            {authService.demoAccounts.map((account) => (
              <PressableScale
                key={account.email}
                disabled={submitting}
                onPress={() => signInWithDemo(account)}
                scaleTo={0.98}
                style={[styles.demoRow, { backgroundColor: colors.surface2 }]}>
                <View style={styles.flex}>
                  <AppText variant="small" color="ink" weight="bold">
                    {account.label}
                  </AppText>
                  <AppText variant="caption" selectable>
                    {account.email} · {account.password}
                  </AppText>
                </View>
                <ChevronRight size={18} color={colors.muted} />
              </PressableScale>
            ))}
          </View>

          {mode === 'signup' ? (
            <AppText variant="caption" align="center" style={styles.note}>
              By joining, you agree to the Terms of Service and Privacy Policy.
            </AppText>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 20, gap: 22 },
  top: { flexDirection: 'row', justifyContent: 'flex-end' },
  brand: { alignItems: 'center', gap: 12 },
  logoGlow: { width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  logo: { width: 80, height: 80, borderRadius: 40 },
  lead: { maxWidth: 300 },
  card: { borderRadius: 24, borderWidth: 1, padding: 20, gap: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  line: { flex: 1, height: 1 },
  google: { height: 52, borderRadius: 999, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  g: { fontFamily: fonts.extrabold, fontSize: 18 },
  note: { paddingHorizontal: 20 },
  error: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12 },
  demo: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 10 },
  demoHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  demoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
});
