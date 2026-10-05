import { router, useLocalSearchParams } from 'expo-router';
import { Eye, EyeOff, LogIn, Mail, UserPlus, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Badge, Button, IconButton, Logo, Screen, SegmentedControl, TextField } from '@/components/ui';
import { useAuth, useTheme, useToast } from '@/providers';
import { errorMessage } from '@/utils/format';

type Mode = 'login' | 'signup';

export default function LoginScreen() {
  const params = useLocalSearchParams<{ mode?: Mode }>();
  const { colors } = useTheme();
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const showToast = useToast();
  const [mode, setMode] = useState<Mode>(params.mode === 'signup' ? 'signup' : 'login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  async function submit() {
    if (!email.includes('@')) return showToast('Enter a valid email address');
    if (mode === 'signup' && !fullName.trim()) return showToast('Enter your full name');
    setSubmitting(true);
    try {
      const user =
        mode === 'signup' ? await signUp({ email, password, fullName }) : await signIn({ email, password });
      showToast(mode === 'signup' ? 'Welcome to Barterdito!' : `Welcome back, ${user.fullName.split(' ')[0]}!`);
      close();
    } catch (error) {
      showToast(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
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
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.surface }]} edges={['top', 'bottom']}>
      <Screen contentStyle={[styles.content, { backgroundColor: colors.surface }]}>
        <View style={styles.top}>
          <Logo compact />
          <Badge label="Login required" tone="orange" />
          <View style={styles.flex} />
          <IconButton icon={X} label="Close" size={18} onPress={close} />
        </View>
        <AppText variant="h1">{mode === 'login' ? 'Welcome back, ka-barter!' : 'Join the trading community'}</AppText>
        <AppText variant="body" color="muted">
          {mode === 'login'
            ? 'Sign in to send offers, save finds, and chat with traders.'
            : 'Create an account and give useful things a second story.'}
        </AppText>
        <SegmentedControl<Mode>
          value={mode}
          onChange={setMode}
          segments={[
            { value: 'login', label: 'Log in' },
            { value: 'signup', label: 'Sign up' },
          ]}
        />
        {mode === 'signup' ? (
          <TextField label="Full name" value={fullName} onChangeText={setFullName} placeholder="Juan Dela Cruz" autoComplete="name" />
        ) : null}
        <TextField
          label="Email address"
          icon={Mail}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
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
        <Button label="Google" variant="secondary" disabled={submitting} onPress={() => void google()} />
        <AppText variant="caption" align="center">
          {mode === 'signup'
            ? 'By joining, you agree to the Terms of Service and Privacy Policy.'
            : 'Preview sign-in: any email and an 8+ character password works.'}
        </AppText>
      </Screen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: 14, padding: 20 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  line: { flex: 1, height: 1 },
});
