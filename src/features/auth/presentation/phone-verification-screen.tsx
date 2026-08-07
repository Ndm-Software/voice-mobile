import { useCallback, useEffect, useMemo, useState } from 'react';

import type { RequestPhoneVerification, VerifyPhone } from '@/application/auth';
import { useSession } from '@/application/session';
import { Badge, Button, Card, Screen, StateView, TextField } from '@/components';
import type { PhoneVerificationChallenge } from '@/domain/repositories/phone-verification-repository';
import { PhoneVerificationError } from '@/domain/repositories/phone-verification-repository';

interface PhoneVerificationScreenProps {
  readonly requestPhoneVerification: RequestPhoneVerification;
  readonly verifyPhone: VerifyPhone;
}

export function PhoneVerificationScreen({
  requestPhoneVerification,
  verifyPhone,
}: PhoneVerificationScreenProps) {
  const { session, signIn } = useSession();
  const [challenge, setChallenge] = useState<PhoneVerificationChallenge | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [loadingChallenge, setLoadingChallenge] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [clock, setClock] = useState(() => Date.now());

  const loadChallenge = useCallback(async () => {
    if (!session?.phoneNumber) {
      setLoadingChallenge(false);
      setError('Oturumda doğrulanacak telefon numarası bulunamadı.');
      return;
    }

    setLoadingChallenge(true);
    setError(undefined);
    try {
      setChallenge(await requestPhoneVerification.execute(session.userId, session.phoneNumber));
      setClock(Date.now());
    } catch (requestError) {
      setError(getVerificationErrorMessage(requestError));
    } finally {
      setLoadingChallenge(false);
    }
  }, [requestPhoneVerification, session?.phoneNumber, session?.userId]);

  useEffect(() => {
    void loadChallenge();
  }, [loadChallenge]);

  useEffect(() => {
    if (!challenge) {
      return;
    }
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [challenge]);

  const expiresInSeconds = useMemo(
    () => secondsUntil(challenge?.expiresAt, clock),
    [challenge?.expiresAt, clock],
  );
  const resendInSeconds = useMemo(
    () => secondsUntil(challenge?.resendAvailableAt, clock),
    [challenge?.resendAvailableAt, clock],
  );

  async function handleVerify() {
    if (!session || !challenge || verifying) {
      return;
    }
    setVerifying(true);
    setError(undefined);
    try {
      await verifyPhone.execute(session.userId, challenge.id, code);
      await signIn({ ...session, phoneVerified: true });
    } catch (verificationError) {
      if (verificationError instanceof PhoneVerificationError) {
        setChallenge((current) =>
          current && verificationError.remainingAttempts !== undefined
            ? { ...current, remainingAttempts: verificationError.remainingAttempts }
            : current,
        );
      }
      setError(getVerificationErrorMessage(verificationError));
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    if (!session?.phoneNumber || resending || resendInSeconds > 0) {
      return;
    }
    setResending(true);
    setError(undefined);
    try {
      const nextChallenge = await requestPhoneVerification.execute(
        session.userId,
        session.phoneNumber,
      );
      setChallenge(nextChallenge);
      setCode('');
      setClock(Date.now());
    } catch (requestError) {
      setError(getVerificationErrorMessage(requestError));
    } finally {
      setResending(false);
    }
  }

  if (loadingChallenge) {
    return (
      <Screen title="Telefon doğrulama">
        <StateView description="Doğrulama kodu hazırlanıyor." variant="loading" />
      </Screen>
    );
  }

  if (!challenge) {
    return (
      <Screen title="Telefon doğrulama">
        <StateView
          actionLabel="Yeniden dene"
          description={error}
          onAction={() => void loadChallenge()}
          variant="error"
        />
      </Screen>
    );
  }

  const canVerify = /^\d{6}$/.test(code) && expiresInSeconds > 0 && challenge.remainingAttempts > 0;

  return (
    <Screen
      description={`${challenge.maskedPhoneNumber} numarasına gönderilen 6 haneli kodu gir.`}
      title="Telefonunu doğrula"
    >
      <Card
        description={`Kod ${formatDuration(expiresInSeconds)} boyunca geçerli • ${challenge.remainingAttempts}/${challenge.maxAttempts} deneme kaldı`}
        title="SMS doğrulaması"
        variant="soft"
      />
      {challenge.developmentCode ? (
        <Card
          accessibilityRole="alert"
          description={challenge.developmentCode}
          title="Doğrulama kodun"
          variant="outlined"
        />
      ) : null}
      {error ? <Badge label={error} variant="danger" /> : null}
      <TextField
        autoComplete="sms-otp"
        editable={!verifying}
        error={expiresInSeconds === 0 ? 'Kodun süresi doldu. Yeni kod isteyin.' : undefined}
        keyboardType="number-pad"
        label="Doğrulama kodu"
        maxLength={6}
        onChangeText={(value) => {
          setCode(value.replace(/\D/g, '').slice(0, 6));
          setError(undefined);
        }}
        onSubmitEditing={() => void handleVerify()}
        placeholder="123456"
        returnKeyType="done"
        textContentType="oneTimeCode"
        value={code}
      />
      <Button
        disabled={!canVerify}
        fullWidth
        label="Telefonu doğrula"
        loading={verifying}
        onPress={() => void handleVerify()}
      />
      <Button
        disabled={resendInSeconds > 0}
        fullWidth
        label={
          resendInSeconds > 0
            ? `Kodu yeniden gönder (${resendInSeconds} sn)`
            : 'Kodu yeniden gönder'
        }
        loading={resending}
        onPress={() => void handleResend()}
        variant="secondary"
      />
    </Screen>
  );
}

function secondsUntil(value: string | undefined, now: number): number {
  if (!value) {
    return 0;
  }
  return Math.max(0, Math.ceil((Date.parse(value) - now) / 1000));
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function getVerificationErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Telefon doğrulama işlemi tamamlanamadı.';
}
