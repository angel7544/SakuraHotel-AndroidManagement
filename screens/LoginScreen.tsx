import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image, Linking, ImageBackground } from 'react-native';
import { supabase } from '../lib/supabase';
import { getUserRoles, signOut } from '../lib/auth';
import { Lock, Mail, User, LogOut, LayoutDashboard } from 'lucide-react-native';

import { useNavigation } from '@react-navigation/native';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    checkUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRoles(session.user);
      } else {
        setRoles([]);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    if (data.user) fetchRoles(data.user);
  };

  const fetchRoles = async (u: any) => {
    const r = await getUserRoles(u);
    setRoles(r);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      Alert.alert('Login Failed', error.message);
    } else if (data.session) {
      // Automatic redirect to dashboard after login
      navigation.navigate('AdminDashboard');
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await signOut();
    setLoading(false);
  };

  if (user) {
    return (
      <ImageBackground 
        source={require('../assets/backgroundlg.jpg')} 
        style={styles.container}
        resizeMode="cover"
      >
        <View style={styles.headerContainer}>
            <Text style={styles.headerText}>HOTEL Management App :- Hotel sakura</Text>
        </View>
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <User size={40} color="#db2777" />
          </View>
          <Text style={styles.userName}>{user.email}</Text>
          <Text style={styles.userRole}>{roles.join(', ') || 'Customer'}</Text>

          {(roles.includes('owner') || roles.includes('staff')) && (
            <TouchableOpacity 
              style={styles.adminButton} 
              onPress={() => navigation.navigate('AdminDashboard')}
            >
              <LayoutDashboard size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.adminButtonText}>Go to Admin Dashboard</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground 
      source={require('../assets/backgroundlg.jpg')} 
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.headerContainer}>
          <Image source={require('../assets/logo.png')} style={styles.headerLogo} resizeMode="contain" />
          <Text style={styles.headerText}>Hotel Sakura Management</Text>
          <Text style={styles.versionText}>Version 5.0.0</Text>
      </View>
      <View style={styles.loginCard}>
        {/* <Text style={styles.title}>Welcome Back</Text> */}
        <Text style={styles.subtitle}>Sign in to your account</Text>

        <View style={styles.inputGroup}>
          <View style={styles.iconWrapper}>
            <Mail size={20} color="#9ca3af" />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.iconWrapper}>
            <Lock size={20} color="#9ca3af" />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#9ca3af"
          />
        </View>

        <TouchableOpacity 
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.footerContainer}>
        <TouchableOpacity onPress={() => Linking.openURL('https://br31tech.live')}>
           <Image source={require('../assets/br31logo.png')} style={styles.logo} resizeMode="contain" />
        </TouchableOpacity>
        <Text style={styles.footerText}>Made with Love @br31tech.live</Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#f9fafb',
    justifyContent: 'center',
    padding: 24,
  },
  headerContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#db2777',
    textAlign: 'center',
  },
  headerLogo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  versionText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 5,
    fontWeight: '600',
  },
  loginCard: {
    backgroundColor: '#ffffff07',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
    textAlign: 'center',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#f9fafb',
  },
  iconWrapper: {
    padding: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
    fontSize: 16,
    color: '#111827',
  },
  loginButton: {
    backgroundColor: '#db2777',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#db2777',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fce7f3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#db2777',
    fontWeight: '600',
    marginBottom: 32,
    textTransform: 'capitalize',
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#db2777',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
    justifyContent: 'center',
  },
  adminButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  footerContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 60,
    marginBottom:10,
  },
  footerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ef460dff',
    marginBottom: 10,
  },
});
