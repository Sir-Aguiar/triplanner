import { SymbolView } from 'expo-symbols';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AtmosphericBackground } from '@/components/atmospheric-background';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import {
  BORDER_RADIUS,
  BottomTabInset,
  MaxContentWidth,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const TIPS = [
  {
    title: 'Defina o orçamento cedo',
    body: 'Comece pelo valor total e distribua por categoria. Assim fica claro onde dá para flexionar e onde não.',
    icon: { ios: 'banknote' as const, android: 'payments' as const, web: 'payments' as const },
  },
  {
    title: 'Monte a linha do tempo',
    body: 'Organize atividades por dia. Deixe folgas entre passeios longos e reserve blocos para refeições.',
    icon: { ios: 'calendar' as const, android: 'event' as const, web: 'event' as const },
  },
  {
    title: 'Separe custos por pessoa',
    body: 'Hospedagem e transfer compartilhados ficam mais justos quando o custo é marcado por viajante.',
    icon: { ios: 'person.2' as const, android: 'group' as const, web: 'group' as const },
  },
] as const;

export default function DicasScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <ThemedView style={styles.root}>
      <AtmosphericBackground />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingBottom: insets.bottom + BottomTabInset + SPACING.md,
            paddingLeft: Math.max(insets.left, SPACING.lg),
            paddingRight: Math.max(insets.right, SPACING.lg),
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText type="subtitle">Dicas</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.intro}>
            Pequenos hábitos que deixam o planejamento mais leve e o roteiro mais realista.
          </ThemedText>
        </View>

        <View style={styles.tipList}>
          {TIPS.map((tip) => (
            <View
              key={tip.title}
              style={[
                styles.tipCard,
                SHADOWS.light,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}>
              <View style={[styles.tipIcon, { backgroundColor: theme.atmosphere }]}>
                <SymbolView
                  name={tip.icon}
                  size={22}
                  tintColor={theme.primary}
                  weight="medium"
                />
              </View>
              <View style={styles.tipCopy}>
                <ThemedText type="smallBold" style={styles.tipTitle}>
                  {tip.title}
                </ThemedText>
                <ThemedText themeColor="textSecondary" type="small">
                  {tip.body}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionsWrapper}>
          <Collapsible title="Como usar categorias">
            <ThemedText type="small" themeColor="textSecondary">
              Categorias como Hospedagem, Voo e Passeio ajudam a ver para onde o dinheiro vai. Use
              cores e ícones para reconhecer cada tipo de gasto na linha do tempo.
            </ThemedText>
          </Collapsible>

          <Collapsible title="Planeje em etapas">
            <ThemedText type="small" themeColor="textSecondary">
              Cadastre a viagem com datas e viajantes, depois vá adicionando atividades. Você pode
              editar orçamento e detalhes a qualquer momento.
            </ThemedText>
          </Collapsible>

          <Collapsible title="Modo convidado">
            <ThemedText type="small" themeColor="textSecondary">
              Dá para organizar roteiros offline sem conta. Quando quiser sincronizar entre
              dispositivos, entre ou crie uma conta no menu.
            </ThemedText>
          </Collapsible>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    paddingTop: SPACING.lg,
    gap: SPACING.lg,
  },
  header: {
    gap: SPACING.sm,
  },
  intro: {
    maxWidth: 360,
  },
  tipList: {
    gap: SPACING.md,
  },
  tipCard: {
    flexDirection: 'row',
    gap: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.md,
    alignItems: 'flex-start',
  },
  tipIcon: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipCopy: {
    flex: 1,
    gap: SPACING.xs,
  },
  tipTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    lineHeight: TYPOGRAPHY.lineHeights.md,
  },
  sectionsWrapper: {
    gap: SPACING.md,
    paddingBottom: SPACING.md,
  },
});
