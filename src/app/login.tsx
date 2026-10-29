import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Hash, KeyRound, Lock, LogIn, Mail, MailCheck, User, UserPlus, X } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, IconButton, SegmentedControl, TextField } from '@/components/ui';
import { useAuth, useTheme, useToast } from '@/providers';
import { authService } from '@/services';
import { elevation } from '@/theme';
import { errorMessage, firstName } from '@/utils/format';

type Mode = 'login' | 'signup' | 'verify' | 'forgot' | 'reset';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const headings: Record<Mode, [string, string]> = {
  login: ['Welcome back,\n', 'ka-barter.'],
  signup: ['Join the\n', 'swap club.'],
  verify: ['Check your\n', 'email.'],
  forgot: ['Forgot your\n', 'password?'],
  reset: ['Choose a new\n', 'password.'],
};

const submitLabels: Record<Mode, string> = {
  login: 'Sign in',
  signup: 'Create account',
  verify: 'Verify email',
  forgot: 'Send reset code',
  reset: 'Reset password',
};

/** UTF-8 byte length; the backend accepts passwords of 8 to 72 bytes. */
function byteLength(value: string) {
  return new TextEncoder().encode(value).length;
}

export default function LoginScreen() {
  const params = useLocalSearchParams<{ mode?: Mode }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { signIn, register, verifyEmail } = useAuth();
  const showToast = useToast();
  const [mode, setMode] = useState<Mode>(params.mode === 'signup' ? 'signup' : 'login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const usesCode = mode === 'verify' || mode === 'reset';
  const passwordsMatch = password === confirmPassword;
  const blocked = mode === 'signup' && (!confirmPassword || !passwordsMatch);

  function changeMode(next: Mode) {
    setMode(next);
    setError('');
    setCode('');
    setPassword('');
    setConfirmPassword('');
  }

  function validate(address: string): string | null {
    if (!EMAIL_PATTERN.test(address)) return 'Enter a valid email address.';
    const name = fullName.trim();
    if (mode === 'signup' && (name.length < 2 || name.length > 120)) return 'Full name must be between 2 and 120 characters.';
    if ((mode === 'signup' || mode === 'reset') && (byteLength(password) < 8 || byteLength(password) > 72)) {
      return 'Password must be between 8 and 72 characters.';
    }
    if (mode === 'signup' && !passwordsMatch) return 'Passwords do not match. Please retype your password.';
    if (usesCode && !/^\d{6}$/.test(code.trim())) return 'Enter the six-digit code you received.';
    if (mode === 'login' && !password) return 'Enter your password.';
    return null;
  }

  async function submit() {
    if (submitting) return;
    const address = (usesCode ? pendingEmail : email).trim().toLowerCase();
    setError('');
    const invalid = validate(address);
    if (invalid) return setError(invalid);
    setSubmitting(true);
    try {
      if (mode === 'signup') {
        await register({ email: address, fullName, password });
        setPendingEmail(address);
        changeMode('verify');
        return;
      }
      if (mode === 'forgot') {
        await authService.forgotPassword(address);
        setPendingEmail(address);
        changeMode('reset');
        showToast('If an account exists, check your email for a reset code.');
        return;
      }
      if (mode === 'reset') {
        await authService.resetPassword(address, code.trim(), password);
        setEmail(address);
        changeMode('login');
        showToast('Password updated. Sign in with your new password.');
        return;
      }
      const user = mode === 'verify' ? await verifyEmail(address, code.trim()) : await signIn({ email: address, password });
      showToast(mode === 'verify' ? `Welcome to Barterdito, ${firstName(user.fullName)}!` : `Welcome back, ${firstName(user.fullName)}!`);
      close();
    } catch (caught) {
      setError(errorMessage(caught, 'Authentication failed.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function resend() {
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'verify') await authService.resendVerification(pendingEmail);
      else await authService.resendPasswordReset(pendingEmail);
      showToast('A new code has been sent.');
    } catch (caught) {
      setError(errorMessage(caught, 'Could not resend the code.'));
    } finally {
      setSubmitting(false);
    }
  }

  const lead =
    mode === 'signup'
      ? 'Create an account and give useful things a second story.'
      : mode === 'verify'
        ? `Enter the six-digit code sent to ${pendingEmail}.`
        : mode === 'forgot'
          ? 'We’ll email you a code to reset your password.'
          : mode === 'reset'
            ? `Enter the code sent to ${pendingEmail} and choose a new password.`
            : 'Sign in to send offers, save finds, and chat with traders.';

  const passwordToggle = (
    <Pressable accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
      {showPassword ? <EyeOff size={18} color={colors.muted} /> : <Eye size={18} color={colors.muted} />}
    </Pressable>
  );

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      {/* Android is edge-to-edge since SDK 54, so the window no longer resizes for the keyboard; pad on both platforms. */}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
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
              {headings[mode][0]}
              <AppText variant="display" color="orange">
                {headings[mode][1]}
              </AppText>
            </AppText>
            <AppText variant="body" color="muted" align="center" style={styles.lead}>
              {lead}
            </AppText>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).duration(600)}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: 'transparent' }, elevation(2, colors)]}>
              {mode === 'login' || mode === 'signup' ? (
                <SegmentedControl<Mode>
                  value={mode}
                  onChange={changeMode}
                  segments={[
                    { value: 'login', label: 'Log in' },
                    { value: 'signup', label: 'Sign up' },
                  ]}
                />
              ) : null}
              {mode === 'signup' ? (
                <TextField label="Full name" icon={User} value={fullName} onChangeText={setFullName} placeholder="Juan Dela Cruz" autoComplete="name" maxLength={120} />
              ) : null}
              {usesCode ? (
                <TextField
                  label="Six-digit code"
                  icon={Hash}
                  value={code}
                  onChangeText={(value) => {
                    setCode(value.replace(/\D/g, '').slice(0, 6));
                    setError('');
                  }}
                  placeholder="123456"
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                  maxLength={6}
                />
              ) : (
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
              )}
              {mode === 'login' || mode === 'signup' || mode === 'reset' ? (
                <TextField
                  label={mode === 'reset' ? 'New password' : 'Password'}
                  icon={Lock}
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    setError('');
                  }}
                  placeholder={mode === 'login' ? 'Your password' : 'At least 8 characters'}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  right={passwordToggle}
                />
              ) : null}
              {mode === 'signup' ? (
                <View style={styles.confirm}>
                  <TextField
                    label="Retype password"
                    icon={KeyRound}
                    value={confirmPassword}
                    onChangeText={(value) => {
                      setConfirmPassword(value);
                      setError('');
                    }}
                    placeholder="Type your password again"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="new-password"
                  />
                  {confirmPassword ? (
                    <View style={styles.match} accessibilityLiveRegion="polite">
                      {passwordsMatch ? <CheckCircle2 size={14} color={colors.green} /> : <AlertCircle size={14} color={colors.red} />}
                      <AppText variant="caption" color={passwordsMatch ? 'green' : 'red'} weight="semibold">
                        {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                      </AppText>
                    </View>
                  ) : null}
                </View>
              ) : null}
              {error ? (
                <View accessibilityLiveRegion="polite" style={[styles.error, { backgroundColor: colors.redSoft }]}>
                  <AlertCircle size={16} color={colors.red} />
                  <AppText variant="small" color="red" weight="semibold" style={styles.flex}>
                    {error}
                  </AppText>
                </View>
              ) : null}
              <Button
                label={submitLabels[mode]}
                icon={mode === 'signup' ? UserPlus : mode === 'verify' ? MailCheck : mode === 'login' ? LogIn : KeyRound}
                loading={submitting}
                disabled={blocked}
                onPress={() => void submit()}
              />
              {mode !== 'signup' ? (
                <View style={styles.links}>
                  {mode === 'login' ? <TextLink label="Forgot password?" disabled={submitting} onPress={() => changeMode('forgot')} /> : null}
                  {usesCode ? <TextLink label="Resend code" disabled={submitting} onPress={() => void resend()} /> : null}
                  {mode !== 'login' ? <TextLink label="Back to login" disabled={submitting} onPress={() => changeMode('login')} /> : null}
                </View>
              ) : null}
            </View>
          </Animated.View>

          <AppText variant="caption" align="center" style={styles.note}>
            {mode === 'signup' ? 'By joining, you agree to the Terms of Service and Privacy Policy.' : 'Your account is secured by Barterdito.'}
          </AppText>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function TextLink({ label, disabled, onPress }: { label: string; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} hitSlop={8}>
      <AppText variant="small" color="orange" weight="bold">
        {label}
      </AppText>
    </Pressable>
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
  confirm: { gap: 6 },
  match: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  links: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 18, rowGap: 8 },
  note: { paddingHorizontal: 20 },
  error: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12 },
});
