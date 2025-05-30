import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  StatusBar,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Login: undefined;
};

type Props = {};

const { width, height } = Dimensions.get('window');

const Welcome: React.FC<Props> = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const featureAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const buttonScaleAnim = useRef(new Animated.Value(0.9)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const floatingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
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
        duration: 15000,
        useNativeDriver: true,
      })
    ).start();

    // Pulse animation for decorative elements
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
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

    // Staggered feature animations
    const featureAnimations = featureAnims.map((anim, index) => 
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: 500 + (index * 200),
        useNativeDriver: true,
      })
    );

    Animated.stagger(200, featureAnimations).start();

    // Button entrance animation
    setTimeout(() => {
      Animated.spring(buttonScaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }, 2000);
  }, []);

  const handleGetStarted = () => {
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
    ]).start(() => {
      navigation.navigate('Login');
    });
  };

  const features = [
    { 
      icon: '📊', 
      title: 'Real-time Analytics', 
      desc: 'Monitor your business performance with live data insights and comprehensive reports.',
      bgColor: '#2563eb'
    },
    { 
      icon: '👥', 
      title: 'Customer Management', 
      desc: 'Build stronger relationships with advanced customer engagement tools.',
      bgColor: '#4f46e5'
    },
    { 
      icon: '📱', 
      title: 'Order Tracking', 
      desc: 'Track every transaction from order placement to delivery completion.',
      bgColor: '#0891b2'
    },
    { 
      icon: '💼', 
      title: 'Business Intelligence', 
      desc: 'Make data-driven decisions with AI-powered business insights.',
      bgColor: '#1d4ed8'
    }
  ];

  const logoRotate = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.3],
  });

  const floatingY = floatingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const floatingY2 = floatingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10],
  });

  const floatingY3 = floatingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  return (
    <View style={{ flex: 1 }}>
      {/* White Background with Decorative Elements */}
      <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
        
        {/* Floating Decorative Circles */}
        <Animated.View 
          style={{
            position: 'absolute',
            top: 100,
            right: 20,
            width: 140,
            height: 140,
            backgroundColor: '#eff6ff', // blue-50
            borderRadius: 70,
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
            top: 250,
            left: -40,
            width: 100,
            height: 100,
            backgroundColor: '#dbeafe', // blue-100
            borderRadius: 50,
            opacity: glowOpacity,
            transform: [
              { scale: pulseAnim },
              { translateY: floatingY2 }
            ],
          }}
        />
        <Animated.View 
          style={{
            position: 'absolute',
            bottom: 180,
            right: -30,
            width: 120,
            height: 120,
            backgroundColor: '#bfdbfe', // blue-200
            borderRadius: 60,
            opacity: glowOpacity,
            transform: [
              { scale: pulseAnim },
              { translateY: floatingY3 }
            ],
          }}
        />
        <Animated.View 
          style={{
            position: 'absolute',
            top: 400,
            left: 20,
            width: 80,
            height: 80,
            backgroundColor: '#93c5fd', // blue-300
            borderRadius: 40,
            opacity: glowOpacity,
            transform: [
              { scale: pulseAnim },
              { translateY: floatingY2 }
            ],
          }}
        />

        <StatusBar barStyle="dark-content" backgroundColor="white" translucent={false} />
        
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Animated Header Section with Logo */}
          <Animated.View 
            style={{
              alignItems: 'center',
              marginTop: 40,
              marginBottom: 40,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }}
          >
            <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <Animated.View 
                style={{
                  width: 128,
                  height: 128,
                  backgroundColor: '#2563eb', // blue-600
                  borderRadius: 64,
                  justifyContent: 'center',
                  alignItems: 'center',
                  transform: [
                    { rotate: logoRotate },
                    { scale: logoScaleAnim }
                  ],
                  shadowColor: '#2563eb',
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.3,
                  shadowRadius: 20,
                  elevation: 15,
                }}
              >
                <Text style={{ fontSize: 48, fontWeight: '900', color: 'white', letterSpacing: 2 }}>
                  WK
                </Text>
              </Animated.View>
              
              {/* Animated Decorative Rings */}
              <Animated.View 
                style={{
                  position: 'absolute',
                  width: 160,
                  height: 160,
                  borderWidth: 4,
                  borderColor: '#60a5fa', // blue-400
                  borderRadius: 80,
                  borderStyle: 'dashed',
                  transform: [{ scale: pulseAnim }],
                  opacity: 0.4,
                }}
              />
              <Animated.View 
                style={{
                  position: 'absolute',
                  width: 192,
                  height: 192,
                  borderWidth: 2,
                  borderColor: '#3b82f6', // blue-500
                  borderRadius: 96,
                  transform: [{ scale: pulseAnim }, { rotate: logoRotate }],
                  opacity: 0.3,
                }}
              />
            </View>
          </Animated.View>

          {/* Animated Title Section */}
          <Animated.View 
            style={{
              alignItems: 'center',
              marginBottom: 32,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }}
          >
            <Text style={{ 
              fontSize: 20, 
              fontWeight: '300', 
              color: '#64748b', // slate-500
              marginBottom: 4, 
              letterSpacing: 1 
            }}>
              Welcome to
            </Text>
            
            <Text style={{ 
              fontSize: 48, 
              fontWeight: '900', 
              color: '#1e293b', // slate-800
              marginBottom: 8, 
              letterSpacing: 1 
            }}>
              Wekeyar
            </Text>
            
            <Text style={{ 
              fontSize: 24, 
              fontWeight: '600', 
              color: '#2563eb', // blue-600
              letterSpacing: 1 
            }}>
              Dashboard
            </Text>

            {/* Animated gradient line replacement */}
            <Animated.View 
              style={{
                width: 96,
                height: 4,
                marginTop: 20,
                borderRadius: 2,
                backgroundColor: '#60a5fa', // blue-400
                transform: [{ scaleX: fadeAnim }]
              }}
            >
              <View 
                style={{
                  position: 'absolute',
                  right: 0,
                  width: '50%',
                  height: '100%',
                  backgroundColor: '#2563eb', // blue-600
                  borderRadius: 2,
                }}
              />
            </Animated.View>
          </Animated.View>

          {/* Enhanced Description */}
          <Animated.View 
            style={{
              marginBottom: 40,
              paddingHorizontal: 8,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }}
          >
            <Text style={{ 
              fontSize: 18, 
              color: '#475569', // slate-600
              textAlign: 'center', 
              lineHeight: 28, 
              fontWeight: '400', 
              letterSpacing: 0.5 
            }}>
              Transform your business operations with intelligent analytics, seamless customer management, and real-time insights that drive exponential growth.
            </Text>
          </Animated.View>

          {/* Animated Features Grid */}
          <View style={{ marginBottom: 40 }}>
            {features.map((feature, index) => (
              <Animated.View 
                key={index} 
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: '#e2e8f0', // slate-200
                  marginBottom: 16,
                  overflow: 'hidden',
                  opacity: featureAnims[index],
                  transform: [{
                    translateX: featureAnims[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    })
                  }],
                  shadowColor: '#2563eb',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                <View style={{ padding: 20, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ 
                    width: 56, 
                    height: 56, 
                    backgroundColor: feature.bgColor, 
                    borderRadius: 28, 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    marginRight: 16,
                    shadowColor: feature.bgColor,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 3,
                  }}>
                    <Text style={{ fontSize: 24 }}>{feature.icon}</Text>
                  </View>
                  
                  <View style={{ flex: 1 }}>
                    <Text style={{ 
                      fontSize: 18, 
                      fontWeight: 'bold', 
                      color: '#1e293b', // slate-800
                      marginBottom: 4, 
                      letterSpacing: 0.5 
                    }}>
                      {feature.title}
                    </Text>
                    <Text style={{ 
                      fontSize: 14, 
                      color: '#64748b', // slate-500
                      lineHeight: 20 
                    }}>
                      {feature.desc}
                    </Text>
                  </View>
                </View>
                
                {/* Animated border glow */}
                <Animated.View 
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderWidth: 2,
                    borderColor: '#2563eb',
                    borderRadius: 16,
                    opacity: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.3],
                    }),
                  }}
                />
              </Animated.View>
            ))}
          </View>

          {/* Enhanced Call-to-Action Button */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Animated.View
              style={{
                transform: [{ scale: buttonScaleAnim }]
              }}
            >
              <Pressable 
                onPress={handleGetStarted}
                style={{
                  backgroundColor: '#2563eb', // blue-600
                  borderRadius: 25,
                  paddingHorizontal: 64,
                  paddingVertical: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#2563eb',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 15,
                  elevation: 8,
                }}
              >
                {/* Gradient effect overlay */}
                <View 
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: '50%',
                    backgroundColor: '#1d4ed8', // blue-700
                    borderTopRightRadius: 25,
                    borderBottomRightRadius: 25,
                    opacity: 0.8,
                  }}
                />
                
                <Text style={{ 
                  fontSize: 20, 
                  fontWeight: '900', 
                  color: 'white', 
                  marginRight: 16, 
                  letterSpacing: 0.5,
                  zIndex: 1,
                }}>
                  Get Started
                </Text>
                <View style={{ 
                  width: 36, 
                  height: 36, 
                  backgroundColor: 'white', 
                  borderRadius: 18, 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  zIndex: 1,
                }}>
                  <Text style={{ fontSize: 18, color: '#2563eb', fontWeight: 'bold' }}>→</Text>
                </View>
              </Pressable>
            </Animated.View>
          </View>

          {/* Enhanced Footer */}
          <Animated.View 
            style={{ 
              alignItems: 'center',
              opacity: fadeAnim 
            }}
          >
            <View style={{ flexDirection: 'row', marginBottom: 16 }}>
              <Animated.View 
                style={{ 
                  width: 12, 
                  height: 12, 
                  backgroundColor: '#60a5fa', // blue-400
                  borderRadius: 6, 
                  marginHorizontal: 4,
                  transform: [{ scale: pulseAnim }] 
                }}
              />
              <View style={{ width: 12, height: 12, backgroundColor: '#2563eb', borderRadius: 6, marginHorizontal: 4 }} />
              <View style={{ width: 12, height: 12, backgroundColor: '#1d4ed8', borderRadius: 6, marginHorizontal: 4 }} />
            </View>
            <Text style={{ 
              fontSize: 14, 
              color: '#64748b', // slate-500
              fontWeight: '500', 
              letterSpacing: 0.5 
            }}>
              Version 1.0.0
            </Text>
          </Animated.View>
        </ScrollView>
      </View>
    </View>
  );
};

export default Welcome;