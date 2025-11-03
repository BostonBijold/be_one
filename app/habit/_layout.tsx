import { Stack } from 'expo-router';

export default function HabitLayout() {
  return (
    <Stack
      screenOptions={{
        presentation: 'transparentModal',
        headerShown: false,
        animationEnabled: true,
        cardOverlayEnabled: true,
        cardStyle: {
          backgroundColor: 'transparent',
        },
      }}
    />
  );
}
