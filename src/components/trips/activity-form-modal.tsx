import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/themed-text';
import { BORDER_RADIUS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ActivityFormModalProps = {
  visible: boolean;
  onClose: () => void;
};

/**
 * Shell do popup de cadastro de atividade.
 * O formulário de atividade será implementado em seguida.
 */
export function ActivityFormModal({ visible, onClose }: ActivityFormModalProps) {
  const theme = useTheme();

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fechar"
        onPress={onClose}
        style={[styles.backdrop, { backgroundColor: 'rgba(15, 23, 42, 0.45)' }]}>
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={[
            styles.sheet,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}>
          <View style={styles.header}>
            <ThemedText type="subtitle" style={styles.title}>
              Nova atividade
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.description}>
              O formulário de atividade será implementado em breve. Por enquanto, finalize o
              cadastro da viagem para continuar.
            </ThemedText>
          </View>

          <Button label="Fechar" variant="secondary" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  sheet: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  header: {
    gap: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xl,
    lineHeight: TYPOGRAPHY.lineHeights.xl,
  },
  description: {
    fontSize: TYPOGRAPHY.sizes.sm,
    lineHeight: TYPOGRAPHY.lineHeights.sm,
  },
});
