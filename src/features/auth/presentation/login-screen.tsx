import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Login } from '@/application/auth';
import { useSession } from '@/application/session';
import { Badge, Button, TextField } from '@/components';
import { routes } from '@/config/routes';
import type { AuthFieldErrors } from '@/domain/repositories/auth-repository';

import { getAuthFieldErrors } from './auth-error';

const googleLogo = require('../../../../assets/images/google-logo.png');

interface LoginScreenProps {
  readonly login: Login;
}

export function LoginScreen({ login }: LoginScreenProps) {
  const router = useRouter();
  const { signIn } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<AuthFieldErrors>({});

  async function handleLogin() {
    if (loading) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const session = await login.execute(email, password);
      await signIn(session);
    } catch (error) {
      setErrors(getAuthFieldErrors(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.page}>
      <View
        pointerEvents="none"
        style={styles.backgroundDecoration}
      >
        <View style={styles.backgroundGlow} />
        <View style={styles.waveSoft} />
        <View style={styles.waveMain} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          <View style={styles.form}>
            <Text style={styles.title}>
              Giriş Yap
            </Text>

            <Text style={styles.subtitle}>
              Devam etmek için bilgilerinizi girin.
            </Text>

            {errors.form ? (
              <View style={styles.formError}>
                <Badge
                  label={errors.form}
                  variant="danger"
                />
              </View>
            ) : null}

            <View style={styles.field}>
              <TextField
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
                error={errors.email}
                keyboardType="email-address"
                label="E-posta adresi"
                onChangeText={(value) => {
                  setEmail(value);

                  setErrors((current) => ({
                    ...current,
                    email: undefined,
                    form: undefined,
                  }));
                }}
                placeholder="isim@example.com"
                returnKeyType="next"
                value={email}
              />
            </View>

            <View style={styles.field}>
              <TextField
                autoComplete="current-password"
                editable={!loading}
                error={errors.password}
                label="Şifre"
                onChangeText={(value) => {
                  setPassword(value);

                  setErrors((current) => ({
                    ...current,
                    password: undefined,
                    form: undefined,
                  }));
                }}
                onSubmitEditing={() => void handleLogin()}
                onTrailingPress={() =>
                  setPasswordVisible((visible) => !visible)
                }
                placeholder="Şifrenizi girin"
                returnKeyType="done"
                secureTextEntry={!passwordVisible}
                trailingAccessibilityLabel={
                  passwordVisible
                    ? 'Şifreyi gizle'
                    : 'Şifreyi göster'
                }
                trailingIcon={
                  passwordVisible
                    ? 'eye-off'
                    : 'eye'
                }
                value={password}
              />
            </View>

            <Pressable
              onPress={() =>
                router.push(routes.forgotPassword)
              }
              style={({ pressed }) => [
                styles.forgotButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.forgotText}>
                Şifremi unuttum
              </Text>
            </Pressable>

            <Button
              fullWidth
              label="Giriş Yap"
              loading={loading}
              onPress={() => void handleLogin()}
            />

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>
                VEYA
              </Text>
              <View style={styles.divider} />
            </View>

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.googleButton,
                pressed && styles.googleButtonPressed,
              ]}
            >
              <Image
                source={googleLogo}
                style={styles.googleLogo}
              />

              <Text style={styles.googleButtonText}>
                Google ile Devam Et
              </Text>
            </Pressable>

            <View style={styles.bottomRow}>
              <Text style={styles.bottomText}>
                Hesabınız yok mu?
              </Text>

              <Pressable
                onPress={() =>
                  router.replace(routes.register)
                }
              >
                <Text style={styles.bottomLink}>
                  Kayıt Ol
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FeatureRow({
  icon,
  title,
  description,
}: {
  readonly icon:
    | 'time-outline'
    | 'language-outline'
    | 'mic-outline';
  readonly title: string;
  readonly description: string;
}) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIcon}>
        <Ionicons
          name={icon}
          size={19}
          color={COLORS.primary}
        />
      </View>

      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>
          {title}
        </Text>

        <Text style={styles.featureDescription}>
          {description}
        </Text>
      </View>
    </View>
  );
}

const COLORS = {
  background: '#F7FAF8',
  surface: '#FFFFFF',
  primary: '#0B5D48',
  primarySoft: '#EAF6F2',
  text: '#17231F',
  textSecondary: '#6E7A75',
  textMuted: '#9AA39F',
  border: '#E3E9E6',
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  keyboard: {
    flex: 1,
  },

  backgroundDecoration: {
  ...StyleSheet.absoluteFill,
  overflow: 'hidden',
},

backgroundGlow: {
  position: 'absolute',
  width: 760,
  height: 190,
  left: -190,
  top: 155,
  borderRadius: 380,
  backgroundColor: 'rgba(69, 194, 163, 0.07)',
  transform: [{ rotate: '-3deg' }],
},

waveSoft: {
  position: 'absolute',
  width: 720,
  height: 90,
  left: -170,
  top: 205,
  borderRadius: 200,
  backgroundColor: 'rgba(48, 183, 151, 0.12)',
  transform: [
    { rotate: '3deg' },
    { scaleX: 1.15 },
  ],
},

waveMain: {
  position: 'absolute',
  width: 760,
  height: 34,
  left: -190,
  top: 235,
  borderRadius: 120,
  backgroundColor: 'rgba(8, 132, 102, 0.25)',
  transform: [
    { rotate: '-2deg' },
    { scaleX: 1.12 },
  ],
},

  content: {
  flexGrow: 1,
  paddingHorizontal: 20,
  paddingTop: 70,
  paddingBottom: 36,
},

  logo: {
    color: COLORS.primary,
    fontSize: 30,
    fontWeight: '800',
  },

  heroTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 8,
  },

  heroDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
    marginBottom: 12,
  },

  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },

  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySoft,
    marginRight: 12,
  },

  featureText: {
    flex: 1,
  },

  featureTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },

  featureDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },

  form: {
    width: '100%',
  },

  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },

  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 7,
    marginBottom: 26,
  },

  formError: {
    marginBottom: 14,
  },

  field: {
    marginBottom: 14,
  },

  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 14,
  },

  forgotText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },

  dividerText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginHorizontal: 12,
  },

  googleButton: {
    width: '100%',
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
  },

  googleButtonPressed: {
    opacity: 0.75,
  },

  googleLogo: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },

  googleButtonText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 26,
    gap: 5,
  },

  bottomText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },

  bottomLink: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '800',
  },

  pressed: {
    opacity: 0.7,
  },
});