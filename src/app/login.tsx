import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Eye, EyeOff, Lock, LogIn, Mail, User, UserPlus, X } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, IconButton, SegmentedControl, TextField } from '@/components/ui';
import { useAuth, useTheme, useToast } from '@/providers';
import { elevation, fonts } from '@/theme';
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

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  async function submit() {
    if (!email.includes('@')) return showToast('Enter a valid email address');
    if (mode === 'signup' && !fullName.trim()) return showToast('Enter your full name');
    setSubmitting(true);
    try {
      const user = mode === 'signup' ? await signUp({ email, password, fullName }) : await signIn({ email, password });
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
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              <TextField
                label="Password"
                icon={Lock}
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
              <Pressable
                accessibilityRole="button"
                disabled={submitting}
                onPress={() => void google()}
                style={({ pressed }) => [styles.google, { backgroundColor: colors.surface, borderColor: colors.hairline }, pressed && { opacity: 0.8 }]}>
                <Text style={[styles.g, { color: colors.blue }]}>G</Text>
                <AppText variant="h3">Continue with Google</AppText>
              </Pressable>
            </View>
          </Animated.View>

          <AppText variant="caption" align="center" style={styles.note}>
            {mode === 'signup'
              ? 'By joining, you agree to the Terms of Service and Privacy Policy.'
              : 'Preview sign-in: any email and an 8+ character password works.'}
          </AppText>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 22 },
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
});
