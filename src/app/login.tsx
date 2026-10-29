import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Hash, KeyRound, Lock, LogIn, Mail, MailCheck, User, UserPlus, X } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, View, type TextInput } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PasswordStrength } from '@/components/auth';
import { AppText, Button, IconButton, SegmentedControl, TextField } from '@/components/ui';
import { useAuth, useTheme, useToast } from '@/providers';
import { authService } from '@/services';
import { elevation } from '@/theme';
import { errorMessage, firstName } from '@/utils/format';
import {
  NAME_MAX_LENGTH,
  normalizeEmail,
  normalizeName,
  validateCode,
  validateConfirmPassword,
  validateEmail,
  validateFullName,
  validateLoginPassword,
  validateNewPassword,
} from '@/utils/validation';

type Mode = 'login' | 'signup' | 'verify' | 'forgot' | 'reset';
type Field = 'fullName' | 'email' | 'code' | 'password' | 'confirm';
type FieldErrors = Partial<Record<Field, string>>;

/** Fields each mode shows, in screen order — also the order used to focus the first invalid one. */
const modeFields: Record<Mode, Field[]> = {
  login: ['email', 'password'],
  signup: ['fullName', 'email', 'password', 'confirm'],
  verify: ['code'],
  forgot: ['email'],
  reset: ['code', 'password'],
};

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
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const [serverError, setServerError] = useState('');

  const refs = {
    fullName: useRef<TextInput>(null),
    email: useRef<TextInput>(null),
    code: useRef<TextInput>(null),
    password: useRef<TextInput>(null),
    confirm: useRef<TextInput>(null),
  };

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const usesCode = mode === 'verify' || mode === 'reset';
  const fields = modeFields[mode];
  const newPassword = mode === 'signup' || mode === 'reset';

  const errors = useMemo<FieldErrors>(() => {
    const result: FieldErrors = {
      fullName: validateFullName(fullName) ?? undefined,
      email: validateEmail(email) ?? undefined,
      code: validateCode(code) ?? undefined,
      password:
        (newPassword ? validateNewPassword(password, { email: mode === 'reset' ? pendingEmail : email, fullName }) : validateLoginPassword(password)) ?? undefined,
      confirm: validateConfirmPassword(password, confirmPassword) ?? undefined,
    };
    return Object.fromEntries(fields.map((field) => [field, result[field]]));
  }, [fields, fullName, email, code, password, confirmPassword, newPassword, mode, pendingEmail]);

  const passwordsMatch = !!confirmPassword && password === confirmPassword;

  /** Errors stay quiet until the user leaves a field or tries to submit, then update live. */
  function visibleError(field: Field) {
    if (field === 'confirm' && confirmPassword && confirmPassword.length >= password.length && !passwordsMatch) return errors.confirm;
    return touched[field] || attempted ? errors[field] : undefined;
  }

  function touch(field: Field) {
    setTouched((current) => (current[field] ? current : { ...current, [field]: true }));
  }

  function edit(setter: (value: string) => void) {
    return (value: string) => {
      setter(value);
      setServerError('');
    };
  }

  function focusNext(field: Field) {
    const next = fields[fields.indexOf(field) + 1];
    if (next) refs[next].current?.focus();
    else void submit();
  }

  function changeMode(next: Mode) {
    setMode(next);
    setServerError('');
    setTouched({});
    setAttempted(false);
    setCode('');
    setPassword('');
    setConfirmPassword('');
  }

  async function submit() {
    if (submitting) return;
    setAttempted(true);
    setServerError('');
    const firstInvalid = fields.find((field) => errors[field]);
    if (firstInvalid) {
      refs[firstInvalid].current?.focus();
      return;
    }
    const address = normalizeEmail(usesCode ? pendingEmail : email);
    setSubmitting(true);
    try {
      if (mode === 'signup') {
        await register({ email: address, fullName: normalizeName(fullName), password });
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
      setServerError(errorMessage(caught, 'Authentication failed.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function resend() {
    if (submitting) return;
    setServerError('');
    setSubmitting(true);
    try {
      if (mode === 'verify') await authService.resendVerification(pendingEmail);
      else await authService.resendPasswordReset(pendingEmail);
      showToast('A new code has been sent.');
    } catch (caught) {
      setServerError(errorMessage(caught, 'Could not resend the code.'));
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

  /** Shared props that wire a field into touch tracking and the next-field keyboard chain. */
  const fieldProps = (field: Field) => ({
    ref: refs[field],
    error: visibleError(field),
    onBlur: () => touch(field),
    onSubmitEditing: () => focusNext(field),
    returnKeyType: field === fields[fields.length - 1] ? ('done' as const) : ('next' as const),
    submitBehavior: field === fields[fields.length - 1] ? ('blurAndSubmit' as const) : ('submit' as const),
  });

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
                <TextField
                  {...fieldProps('fullName')}
                  label="Full name"
                  icon={User}
                  value={fullName}
                  onChangeText={edit(setFullName)}
                  placeholder="Juan Dela Cruz"
                  autoCapitalize="words"
                  autoComplete="name"
                  textContentType="name"
                  maxLength={NAME_MAX_LENGTH}
                />
              ) : null}
              {usesCode ? (
                <TextField
                  {...fieldProps('code')}
                  label="Six-digit code"
                  icon={Hash}
                  value={code}
                  onChangeText={edit((value) => setCode(value.replace(/\D/g, '').slice(0, 6)))}
                  placeholder="123456"
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                  maxLength={6}
                />
              ) : (
                <TextField
                  {...fieldProps('email')}
                  label="Email address"
                  icon={Mail}
                  value={email}
                  onChangeText={edit((value) => setEmail(value.replace(/\s/g, '')))}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  maxLength={254}
                />
              )}
              {mode === 'login' || newPassword ? (
                <View style={styles.group}>
                  <TextField
                    {...fieldProps('password')}
                    label={mode === 'reset' ? 'New password' : 'Password'}
                    icon={Lock}
                    value={password}
                    onChangeText={edit(setPassword)}
                    placeholder={mode === 'login' ? 'Your password' : 'Create a strong password'}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    textContentType={mode === 'login' ? 'password' : 'newPassword'}
                    right={passwordToggle}
                  />
                  {newPassword && password ? <PasswordStrength password={password} rejected={!!errors.password} /> : null}
                </View>
              ) : null}
              {mode === 'signup' ? (
                <View style={styles.group}>
                  <TextField
                    {...fieldProps('confirm')}
                    label="Retype password"
                    icon={KeyRound}
                    value={confirmPassword}
                    onChangeText={edit(setConfirmPassword)}
                    placeholder="Type your password again"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="new-password"
                    textContentType="newPassword"
                  />
                  {passwordsMatch ? (
                    <View style={styles.match} accessibilityLiveRegion="polite">
                      <CheckCircle2 size={14} color={colors.green} />
                      <AppText variant="caption" color="green" weight="semibold">
                        Passwords match
                      </AppText>
                    </View>
                  ) : null}
                </View>
              ) : null}
              {serverError ? (
                <View accessibilityLiveRegion="polite" style={[styles.error, { backgroundColor: colors.redSoft }]}>
                  <AlertCircle size={16} color={colors.red} />
                  <AppText variant="small" color="red" weight="semibold" style={styles.flex}>
                    {serverError}
                  </AppText>
                </View>
              ) : null}
              <Button
                label={submitLabels[mode]}
                icon={mode === 'signup' ? UserPlus : mode === 'verify' ? MailCheck : mode === 'login' ? LogIn : KeyRound}
                loading={submitting}
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
  group: { gap: 10 },
  match: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  links: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 18, rowGap: 8 },
  note: { paddingHorizontal: 20 },
  error: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12 },
});
