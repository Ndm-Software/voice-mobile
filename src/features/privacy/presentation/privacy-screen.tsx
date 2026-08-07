import { useState } from 'react';

import type { DeleteAccount } from '@/application/user';
import { useSession } from '@/application/session';
import { AppModal, Badge, Button, Card, Screen } from '@/components';

interface PrivacyScreenProps {
  readonly deleteAccount: DeleteAccount;
}

export function PrivacyScreen({ deleteAccount }: PrivacyScreenProps) {
  const { logout, session } = useSession();
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!session || loading) return;
    setLoading(true);
    setError(undefined);
    try {
      await deleteAccount.execute(session.userId);
      setVisible(false);
      await logout();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Hesap silinemedi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen
      description="Gizlilik politikaları, veri talepleri ve hesap silme."
      title="Gizlilik ve yasal"
    >
      <Card
        description="Hesap bilgilerin ve tercihlerin yalnızca hesabınla ilişkilendirilir."
        title="Gizlilik"
        variant="soft"
      />
      <Card
        description="Bu işlem geri alınamaz ve hesabındaki verileri kaldırır."
        title="Hesap yönetimi"
        variant="outlined"
      >
        {error ? <Badge label={error} variant="danger" /> : null}
        <Button
          fullWidth
          label="Hesabımı sil"
          onPress={() => setVisible(true)}
          variant="destructive"
        />
      </Card>
      <AppModal onClose={() => setVisible(false)} title="Hesabı sil" visible={visible}>
        <Card
          description="Hesabın, ayarların ve hatırlatıcıların kaldırılacak."
          title="Bu işlem geri alınamaz"
          variant="soft"
        >
          <Button
            fullWidth
            label="Hesabı kalıcı olarak sil"
            loading={loading}
            onPress={() => void handleDelete()}
            variant="destructive"
          />
        </Card>
      </AppModal>
    </Screen>
  );
}
