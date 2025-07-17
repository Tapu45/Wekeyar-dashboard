import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  Animated,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import api, { API_ROUTES } from '../utils/api';

const { width, height } = Dimensions.get('window');

type CreateUserData = {
  username: string;
  email: string;
  password: string;
  role: string;
};

type RootStackParamList = {
  Dashboard: undefined;
  UserCreation: undefined;
};

type Props = {};

const UserCreation: React.FC<Props> = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // Form state
  const [formData, setFormData] = useState<CreateUserData>({
    username: '',
    email: '',
    password: '',
    role: 'tellecaller', // Fixed role as per your requirement
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<CreateUserData>>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const headerAnim = useRef(new Animated.Value(-100)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const floatingAnim = useRef(new Animated.Value(0)).current;
  const formFieldAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  React.useEffect(() => {
    startAnimations();
  }, []);

  React.useEffect(() => {
    validateForm();
  }, [formData]);

  React.useEffect(() => {
    if (notification.type) {
      const timer = setTimeout(() => {
        setNotification({ type: null, message: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const startAnimations = () => {
    // Main entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(headerAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate form fields with stagger
    const fieldAnimations = formFieldAnims.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      })
    );
    Animated.stagger(100, fieldAnimations).start();

    // Pulse animation for interactive elements
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(floatingAnim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const validateForm = () => {
    const newErrors: Partial<CreateUserData> = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    setIsFormValid(
      Object.keys(newErrors).length === 0 &&
      Boolean(formData.username) &&
      Boolean(formData.email) &&
      Boolean(formData.password)
    );
  };

  const handleInputChange = (field: keyof CreateUserData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear notification when user starts typing
    if (notification.type) {
      setNotification({ type: null, message: '' });
    }
  };

  const handleSubmit = async () => {
    if (!isFormValid) {
      Alert.alert('Validation Error', 'Please fix all errors before submitting');
      return;
    }

    try {
      setLoading(true);
      setNotification({ type: null, message: '' });

      const response = await api.post(API_ROUTES.CREATE_USER, {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      if (response.status === 201) {
        setNotification({
          type: 'success',
          message: 'User created successfully!',
        });
        
        // Reset form
        setFormData({
          username: '',
          email: '',
          password: '',
          role: 'tellecaller',
        });
        setErrors({});

        // Show success alert with options
        setTimeout(() => {
          Alert.alert(
            'Success! 🎉',
            `Telecaller "${formData.username}" has been created successfully.`,
            [
              {
                text: 'Create Another',
                onPress: () => {
                  // Form is already reset
                },
              },
              {
                text: 'Go Back',
                onPress: () => navigation.goBack(),
                style: 'default',
              },
            ]
          );
        }, 1000);
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      let errorMessage = 'Failed to create user. Please try again.';
      
      if (error.response?.status === 409) {
        errorMessage = 'Username or email already exists.';
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid input data. Please check all fields.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      setNotification({
        type: 'error',
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const getFieldError = (field: keyof CreateUserData) => {
    return errors[field];
  };

  const getInputBorderColor = (field: keyof CreateUserData) => {
    if (errors[field]) return 'border-red-300';
    if (formData[field] && !errors[field]) return 'border-green-300';
    return 'border-blue-200';
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.3],
  });

  const floatingY = floatingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Floating Decorative Elements */}
      <Animated.View 
        className="absolute w-32 h-32 bg-blue-50 rounded-full z-10"
        style={{ 
          top: 100, 
          right: -20,
          opacity: glowOpacity,
          transform: [{ translateY: floatingY }, { scale: pulseAnim }]
        }} 
      />
      <Animated.View 
        className="absolute w-24 h-24 bg-blue-100 rounded-full z-10"
        style={{ 
          bottom: 200, 
          left: -10,
          opacity: glowOpacity,
          transform: [{ translateY: floatingY }, { scale: pulseAnim }]
        }} 
      />

      <StatusBar barStyle="dark-content" backgroundColor="white" translucent={false} />

      {/* Header */}
      <Animated.View 
        className="bg-blue-600 pt-15 px-5 pb-6"
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: headerAnim }]
        }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            className="w-12 h-12 rounded-full bg-blue-500 justify-center items-center"
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text className="text-xl text-white font-bold">←</Text>
          </TouchableOpacity>
          <View className="flex-1 items-center">
            <Text className="text-3xl font-black text-white mb-1">Create User</Text>
            <Text className="text-blue-100 font-medium">
              Add new telecallers to the system
            </Text>
          </View>
          <View className="w-12 h-12 rounded-full bg-blue-500 justify-center items-center">
            <Text className="text-xl">👥</Text>
          </View>
        </View>
      </Animated.View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View 
          className="p-5"
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }}
        >
          {/* Notification Banner */}
          {notification.type && (
            <Animated.View 
              className={`p-4 rounded-xl mb-5 flex-row items-center ${
                notification.type === 'success' 
                  ? 'bg-green-100 border border-green-200' 
                  : 'bg-red-100 border border-red-200'
              }`}
              style={{
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }}
            >
              <Text className="text-xl mr-3">
                {notification.type === 'success' ? '✅' : '❌'}
              </Text>
              <Text className={`flex-1 font-semibold ${
                notification.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {notification.message}
              </Text>
            </Animated.View>
          )}

          {/* Form Card */}
          <View className="bg-white rounded-2xl border border-blue-100 shadow-lg overflow-hidden">
            {/* Card Header */}
            <View className="bg-gradient-to-r from-blue-500 to-blue-600 p-5">
              <View className="flex-row items-center">
                <Text className="text-xl mr-3">👥</Text>
                <Text className="text-xl font-bold text-white">New Telecaller Information</Text>
              </View>
            </View>

            {/* Form Fields */}
            <View className="p-6">
              {/* Username Field */}
              <Animated.View 
                className="mb-6"
                style={{
                  opacity: formFieldAnims[0],
                  transform: [{
                    translateY: formFieldAnims[0].interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    })
                  }]
                }}
              >
                <Text className="text-blue-800 font-semibold mb-2">Username:</Text>
                <View className="relative">
                  <View className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                    <Text className="text-blue-500 text-lg">👤</Text>
                  </View>
                  <TextInput
                    className={`border-2 ${getInputBorderColor('username')} rounded-xl px-4 py-3 pl-12 text-base text-slate-800 bg-white font-medium`}
                    placeholder="Enter username"
                    placeholderTextColor="#94a3b8"
                    value={formData.username}
                    onChangeText={(value) => handleInputChange('username', value)}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <View className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Text className="text-lg">
                      {formData.username && !errors.username ? '✅' : errors.username ? '❌' : ''}
                    </Text>
                  </View>
                </View>
                {getFieldError('username') && (
                  <Text className="text-red-500 text-xs mt-1 font-medium">
                    {getFieldError('username')}
                  </Text>
                )}
              </Animated.View>

              {/* Email Field */}
              <Animated.View 
                className="mb-6"
                style={{
                  opacity: formFieldAnims[1],
                  transform: [{
                    translateY: formFieldAnims[1].interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    })
                  }]
                }}
              >
                <Text className="text-blue-800 font-semibold mb-2">Email:</Text>
                <View className="relative">
                  <View className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                    <Text className="text-blue-500 text-lg">📧</Text>
                  </View>
                  <TextInput
                    className={`border-2 ${getInputBorderColor('email')} rounded-xl px-4 py-3 pl-12 text-base text-slate-800 bg-white font-medium`}
                    placeholder="Enter email address"
                    placeholderTextColor="#94a3b8"
                    value={formData.email}
                    onChangeText={(value) => handleInputChange('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <View className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Text className="text-lg">
                      {formData.email && !errors.email ? '✅' : errors.email ? '❌' : ''}
                    </Text>
                  </View>
                </View>
                {getFieldError('email') && (
                  <Text className="text-red-500 text-xs mt-1 font-medium">
                    {getFieldError('email')}
                  </Text>
                )}
              </Animated.View>

              {/* Password Field */}
              <Animated.View 
                className="mb-6"
                style={{
                  opacity: formFieldAnims[2],
                  transform: [{
                    translateY: formFieldAnims[2].interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    })
                  }]
                }}
              >
                <Text className="text-blue-800 font-semibold mb-2">Password:</Text>
                <View className="relative">
                  <View className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                    <Text className="text-blue-500 text-lg">🔒</Text>
                  </View>
                  <TextInput
                    className={`border-2 ${getInputBorderColor('password')} rounded-xl px-4 py-3 pl-12 pr-20 text-base text-slate-800 bg-white font-medium`}
                    placeholder="Enter password"
                    placeholderTextColor="#94a3b8"
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <View className="absolute right-4 top-1/2 -translate-y-1/2 flex-row items-center">
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      activeOpacity={0.8}
                      className="mr-2"
                    >
                      <Text className="text-lg">{showPassword ? '🙈' : '👁️'}</Text>
                    </TouchableOpacity>
                    <Text className="text-lg">
                      {formData.password && !errors.password ? '✅' : errors.password ? '❌' : ''}
                    </Text>
                  </View>
                </View>
                {getFieldError('password') && (
                  <Text className="text-red-500 text-xs mt-1 font-medium">
                    {getFieldError('password')}
                  </Text>
                )}
              </Animated.View>

              {/* Role Display */}
              <View className="mb-6">
                <Text className="text-blue-800 font-semibold mb-2">Role:</Text>
                <View className="border-2 border-blue-200 rounded-xl p-4 bg-blue-50">
                  <View className="flex-row items-center">
                    <Text className="text-xl mr-3">📞</Text>
                    <Text className="text-base text-blue-800 font-semibold">Telecaller</Text>
                  </View>
                  <Text className="text-sm text-blue-600 mt-1">
                    Customer calling and order management access
                  </Text>
                </View>
              </View>

              {/* Submit Button */}
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                  className={`rounded-xl py-4 px-6 flex-row items-center justify-center ${
                    isFormValid && !loading
                      ? 'bg-blue-600'
                      : 'bg-gray-400'
                  }`}
                  onPress={handleSubmit}
                  disabled={!isFormValid || loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <>
                      <ActivityIndicator size="small" color="white" className="mr-2" />
                      <Text className="text-white text-lg font-bold">Creating User...</Text>
                    </>
                  ) : (
                    <>
                      <Text className="text-xl mr-2">👥</Text>
                      <Text className="text-white text-lg font-bold">Create User</Text>
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>

          {/* Form Summary */}
          {isFormValid && (
            <Animated.View 
              className="bg-green-50 rounded-2xl border border-green-200 p-5 mt-5"
              style={{
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }}
            >
              <View className="flex-row items-center mb-3">
                <Text className="text-lg mr-2">✅</Text>
                <Text className="text-lg font-bold text-green-800">Ready to Create</Text>
              </View>
              <Text className="text-sm text-green-700">
                Username: <Text className="font-semibold">{formData.username}</Text>{'\n'}
                Email: <Text className="font-semibold">{formData.email}</Text>{'\n'}
                Role: <Text className="font-semibold">Telecaller</Text>
              </Text>
            </Animated.View>
          )}

          {/* Security Note */}
          <View className="bg-blue-50 rounded-2xl border border-blue-200 p-5 mt-5">
            <View className="flex-row items-center mb-3">
              <Text className="text-lg mr-2">🔐</Text>
              <Text className="text-lg font-bold text-blue-800">Security Notice</Text>
            </View>
            <Text className="text-sm text-blue-700 leading-5">
              • Password will be securely hashed before storage{'\n'}
              • Telecaller role provides customer calling access{'\n'}
              • User will login with username and password{'\n'}
              • All activities will be logged for security
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default UserCreation;