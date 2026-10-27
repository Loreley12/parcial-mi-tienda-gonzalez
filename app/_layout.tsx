import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Stack, router, useSegments } from 'expo-router';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from '../drizzle/migrations';
import { db } from '../db/client';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { StatusBar } from 'expo-status-bar';

function RootNavigation() {
  const { session, loading: authLoading } = useAuth();
  const { success: migrationSuccess, error: migrationError } = useMigrations(db, migrations);
  const segments = useSegments();

  // Redirección reactiva y protección de rutas
  useEffect(() => {
    if (authLoading) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'registro';

    if (!session && !inAuthGroup) {
      router.replace('/login');
    } else if (session && inAuthGroup) {
      router.replace('/');
    }
  }, [session, authLoading, segments]);

  if (migrationError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Error al iniciar base de datos local:</Text>
        <Text style={styles.errorText}>{migrationError.message}</Text>
      </View>
    );
  }

  if (authLoading || (!migrationSuccess && !migrationError)) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={styles.loadingText}>
          {!migrationSuccess ? 'Inicializando base de datos local...' : 'Verificando sesión...'}
        </Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0284c7' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: 'bold' },
        contentStyle: { backgroundColor: '#f8fafc' },
      }}
    >
      {/* Rutas públicas: Solo accesibles sin sesión */}
      <Stack.Protected guard={!session}>
        <Stack.Screen name="login" options={{ headerShown: false, title: 'Iniciar Sesión' }} />
        <Stack.Screen name="registro" options={{ headerShown: false, title: 'Crear Cuenta' }} />
      </Stack.Protected>

      {/* Rutas autenticadas: Solo accesibles con sesión */}
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="index" options={{ headerShown: false, title: 'Mi Tienda' }} />
        <Stack.Screen name="producto" options={{ headerShown: true, title: 'Producto' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootNavigation />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 15,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#b91c1c',
    marginBottom: 8,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
    textAlign: 'center',
  },
});
