import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  Alert, 
  StatusBar,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import api, { API_ROUTES } from '../utils/api';
import { AuthStorage } from '../utils/AuthStorage';

type RootStackParamList = {
  Dashboard: undefined;
  Welcome: undefined;
};

type Props = {};

const { width, height } = Dimensions.get('window');

const Login: React.FC<Props> = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  
  // State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(0.95)).current;
  const inputFocusAnim = useRef(new Animated.Value(0)).current;
  const loadingRotateAnim = useRef(new Animated.Value(0)).current;
  const floatingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Logo rotation animation
    Animated.loop(
      Animated.timing(logoRotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();

    // Pulse animation for decorative elements
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Button entrance animation
    setTimeout(() => {
      Animated.spring(buttonScaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }, 1000);
  }, []);

  // Loading animation
  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.timing(loadingRotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      loadingRotateAnim.setValue(0);
    }
  }, [isLoading]);

  const handleLogin = async () => {
  if (!username.trim() || !password.trim()) {
    Alert.alert('Error', 'Please fill in both username and password');
    return;
  }

  setIsLoading(true);

  // Button press animation
  Animated.sequence([
    Animated.timing(buttonScaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }),
    Animated.timing(buttonScaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }),
  ]).start();

  try {
    const response = await api.post(API_ROUTES.LOGIN, {
      username,
      password,
    });

    if (response.status === 200) {
      // Save authentication data
      const token = response.data.token || 'mock_token'; // Use actual token from response
      const userData = response.data.user || { username, role: 'telecaller' };
      
      await AuthStorage.saveAuthData(token, userData);

      // Success animation
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        navigation.navigate('Dashboard');
      });
    } else {
      setIsLoading(false);
      Alert.alert('Login Failed', 'Invalid username or password');
    }
  } catch (error) {
    setIsLoading(false);
    console.error('Login error:', error);
    Alert.alert('Login Failed', 'An error occurred while logging in');
  }
};

  const handleInputFocus = (inputName: string) => {
    setFocusedInput(inputName);
    Animated.timing(inputFocusAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleInputBlur = () => {
    setFocusedInput(null);
    Animated.timing(inputFocusAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const logoRotate = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.3],
  });

  const loadingRotate = loadingRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const floatingY = floatingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const inputBorderColor = inputFocusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#e2e8f0', '#2563eb'],
  });

  const inputShadowOpacity = inputFocusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.1],
  });

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* White Background with Decorative Elements */}
      <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
        
        {/* Floating Decorative Circles */}
        <Animated.View 
          style={{
            position: 'absolute',
            top: 80,
            right: 30,
            width: 120,
            height: 120,
            backgroundColor: '#eff6ff', // blue-50
            borderRadius: 60,
            opacity: glowOpacity,
            transform: [
              { scale: pulseAnim },
              { translateY: floatingY }
            ],
          }}
        />
        <Animated.View 
          style={{
            position: 'absolute',
            top: 200,
            left: -30,
            width: 80,
            height: 80,
            backgroundColor: '#dbeafe', // blue-100
            borderRadius: 40,
            opacity: glowOpacity,
            transform: [
              { scale: pulseAnim },
              { translateY: floatingAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 10],
              })}
            ],
          }}
        />
        <Animated.View 
          style={{
            position: 'absolute',
            bottom: 200,
            right: -20,
            width: 100,
            height: 100,
            backgroundColor: '#bfdbfe', // blue-200
            borderRadius: 50,
            opacity: glowOpacity,
            transform: [
              { scale: pulseAnim },
              { translateY: floatingAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -20],
              })}
            ],
          }}
        />

        <StatusBar barStyle="dark-content" backgroundColor="white" translucent={false} />
        
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 60 }}>
            
            {/* Back Button */}
            <Animated.View
              style={{
                alignSelf: 'flex-start',
                marginBottom: 20,
                opacity: fadeAnim,
              }}
            >
              <Pressable 
                onPress={() => navigation.navigate('Welcome')}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: '#f8fafc', // slate-50
                  borderWidth: 1,
                  borderColor: '#e2e8f0', // slate-200
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <Text style={{ fontSize: 20, color: '#475569', fontWeight: 'bold' }}>←</Text>
              </Pressable>
            </Animated.View>

            {/* Logo Section */}
            <Animated.View 
              style={{
                alignItems: 'center',
                marginTop: 20,
                marginBottom: 50,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }}
            >
              <Animated.View 
                style={{
                  width: 100,
                  height: 100,
                  backgroundColor: '#2563eb', // blue-600
                  borderRadius: 50,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 20,
                  transform: [
                    { rotate: logoRotate },
                    { scale: logoScaleAnim }
                  ],
                  shadowColor: '#2563eb',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 15,
                  elevation: 12,
                }}
              >
                <Text style={{ fontSize: 36, fontWeight: '900', color: 'white', letterSpacing: 1 }}>
                  WK
                </Text>
              </Animated.View>
              
              <Text style={{ 
                fontSize: 32, 
                fontWeight: '900', 
                color: '#1e293b', // slate-800
                marginBottom: 8, 
                letterSpacing: 1 
              }}>
                Welcome Back
              </Text>
              <Text style={{ 
                fontSize: 16, 
                color: '#64748b', // slate-500
                textAlign: 'center', 
                letterSpacing: 0.5 
              }}>
                Sign in to access your dashboard
              </Text>
            </Animated.View>

            {/* Form Section */}
            <Animated.View 
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }}
            >
              {/* Username Input */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '600', 
                  color: '#374151', // gray-700
                  marginBottom: 8,
                  marginLeft: 4,
                }}>
                  Username
                </Text>
                <Animated.View
                  style={{
                    borderWidth: 2,
                    borderColor: focusedInput === 'username' ? inputBorderColor : '#e5e7eb', // gray-200
                    borderRadius: 12,
                    backgroundColor: '#ffffff',
                    shadowColor: '#2563eb',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: focusedInput === 'username' ? inputShadowOpacity : 0,
                    shadowRadius: 8,
                    elevation: focusedInput === 'username' ? 3 : 0,
                  }}
                >
                  <TextInput
                    style={{
                      padding: 16,
                      fontSize: 16,
                      color: '#1f2937', // gray-800
                      fontWeight: '500',
                    }}
                    placeholder="Enter your username"
                    placeholderTextColor="#9ca3af" // gray-400
                    value={username}
                    onChangeText={setUsername}
                    onFocus={() => handleInputFocus('username')}
                    onBlur={handleInputBlur}
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                </Animated.View>
              </View>

              {/* Password Input */}
              <View style={{ marginBottom: 30 }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '600', 
                  color: '#374151', // gray-700
                  marginBottom: 8,
                  marginLeft: 4,
                }}>
                  Password
                </Text>
                <Animated.View
                  style={{
                    borderWidth: 2,
                    borderColor: focusedInput === 'password' ? inputBorderColor : '#e5e7eb', // gray-200
                    borderRadius: 12,
                    backgroundColor: '#ffffff',
                    shadowColor: '#2563eb',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: focusedInput === 'password' ? inputShadowOpacity : 0,
                    shadowRadius: 8,
                    elevation: focusedInput === 'password' ? 3 : 0,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <TextInput
                    style={{
                      flex: 1,
                      padding: 16,
                      fontSize: 16,
                      color: '#1f2937', // gray-800
                      fontWeight: '500',
                    }}
                    placeholder="Enter your password"
                    placeholderTextColor="#9ca3af" // gray-400
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => handleInputFocus('password')}
                    onBlur={handleInputBlur}
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                  />
                  <Pressable 
                    onPress={() => setShowPassword(!showPassword)}
                    style={{ paddingHorizontal: 16 }}
                    disabled={isLoading}
                  >
                    <Text style={{ fontSize: 14, color: '#2563eb', fontWeight: '600' }}>
                      {showPassword ? 'Hide' : 'Show'}
                    </Text>
                  </Pressable>
                </Animated.View>
              </View>

              {/* Login Button */}
              <Animated.View
                style={{
                  transform: [{ scale: buttonScaleAnim }]
                }}
              >
                <Pressable 
                  onPress={handleLogin}
                  disabled={isLoading}
                  style={{
                    backgroundColor: isLoading ? '#4f46e5' : '#2563eb', // blue-600
                    borderRadius: 16,
                    paddingVertical: 18,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#2563eb',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    elevation: 8,
                    opacity: isLoading ? 0.8 : 1,
                  }}
                >
                  {/* Gradient effect overlay */}
                  <View 
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: '40%',
                      backgroundColor: '#1d4ed8', // blue-700
                      borderTopRightRadius: 16,
                      borderBottomRightRadius: 16,
                      opacity: 0.8,
                    }}
                  />
                  
                  {isLoading ? (
                    <>
                      <Animated.View
                        style={{
                          marginRight: 12,
                          transform: [{ rotate: loadingRotate }]
                        }}
                      >
                        <ActivityIndicator size="small" color="white" />
                      </Animated.View>
                      <Text style={{ 
                        fontSize: 18, 
                        fontWeight: '700', 
                        color: 'white', 
                        letterSpacing: 0.5,
                        zIndex: 1,
                      }}>
                        Signing In...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={{ 
                        fontSize: 18, 
                        fontWeight: '700', 
                        color: 'white', 
                        marginRight: 12,
                        letterSpacing: 0.5,
                        zIndex: 1,
                      }}>
                        Sign In
                      </Text>
                      <View style={{ 
                        width: 28, 
                        height: 28, 
                        backgroundColor: 'white', 
                        borderRadius: 14, 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        zIndex: 1,
                      }}>
                        <Text style={{ fontSize: 14, color: '#2563eb', fontWeight: 'bold' }}>→</Text>
                      </View>
                    </>
                  )}
                </Pressable>
              </Animated.View>

              {/* Additional Options */}
              <View style={{ marginTop: 30, alignItems: 'center' }}>
                <Pressable disabled={isLoading}>
                  <Text style={{ 
                    fontSize: 14, 
                    color: '#2563eb', // blue-600
                    fontWeight: '600',
                    textDecorationLine: 'underline',
                  }}>
                    Forgot Password?
                  </Text>
                </Pressable>
              </View>
            </Animated.View>

            {/* Footer */}
            <Animated.View 
              style={{ 
                flex: 1,
                justifyContent: 'flex-end',
                alignItems: 'center',
                paddingBottom: 40,
                opacity: fadeAnim,
              }}
            >
              <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                <Animated.View 
                  style={{ 
                    width: 8, 
                    height: 8, 
                    backgroundColor: '#3b82f6', // blue-500
                    borderRadius: 4, 
                    marginHorizontal: 3,
                    transform: [{ scale: pulseAnim }] 
                  }}
                />
                <View style={{ width: 8, height: 8, backgroundColor: '#2563eb', borderRadius: 4, marginHorizontal: 3 }} />
                <View style={{ width: 8, height: 8, backgroundColor: '#1d4ed8', borderRadius: 4, marginHorizontal: 3 }} />
              </View>
              <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '500' }}>
                Secure Login • Powered by Wekeyar
              </Text>
            </Animated.View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

export default Login;