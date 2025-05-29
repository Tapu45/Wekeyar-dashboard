import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { MotiView, MotiText } from 'moti';
import { Easing } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

type RootStackParamList = {
  Login: undefined;
};

type Props = {};

const Welcome: React.FC<Props> = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const handleGetStarted = () => {
    navigation.navigate('Login');
  };

  // Floating animation for background elements
  const floatingAnimation = {
    from: { translateY: 0 },
    animate: { translateY: [-10, 10, -10] },
    transition: {
      loop: true,
      duration: 3000,
      easing: Easing.inOut(Easing.ease),
    },
  };

  const pulseAnimation = {
    from: { scale: 1 },
    animate: { scale: [1, 1.05, 1] },
    transition: {
      loop: true,
      duration: 2000,
      easing: Easing.inOut(Easing.ease),
    },
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e40af" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#1e40af', '#3b82f6', '#60a5fa']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Animated Background Elements */}
      <MotiView
        {...floatingAnimation}
        style={[styles.backgroundElement, { top: height * 0.1, right: width * 0.1 }]}
      >
        <View style={[styles.circle, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
      </MotiView>

      <MotiView
        {...floatingAnimation}
        transition={{ ...floatingAnimation.transition, delay: 1000 }}
        style={[styles.backgroundElement, { bottom: height * 0.2, left: width * 0.05 }]}
      >
        <View style={[styles.circle, { backgroundColor: 'rgba(255,255,255,0.08)', transform: [{ scale: 1.5 }] }]} />
      </MotiView>

      <MotiView
        {...floatingAnimation}
        transition={{ ...floatingAnimation.transition, delay: 2000 }}
        style={[styles.backgroundElement, { top: height * 0.3, left: width * 0.7 }]}
      >
        <View style={[styles.circle, { backgroundColor: 'rgba(255,255,255,0.06)', transform: [{ scale: 0.8 }] }]} />
      </MotiView>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Logo/Icon Section */}
        <MotiView
          from={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: 'timing',
            duration: 1000,
            easing: Easing.out(Easing.back(1.7)),
          }}
          style={styles.logoContainer}
        >
          <MotiView
            {...pulseAnimation}
            style={styles.logoBackground}
          >
            <Text style={styles.logoText}>WK</Text>
          </MotiView>
        </MotiView>

        {/* Title Section */}
        <MotiView
          from={{ translateY: 50, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{
            type: 'timing',
            duration: 1000,
            delay: 500,
            easing: Easing.out(Easing.quad),
          }}
          style={styles.titleContainer}
        >
          <MotiText
            from={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{
              type: 'timing',
              duration: 800,
              delay: 700,
              easing: Easing.out(Easing.back(1.2)),
            }}
            style={styles.title}
          >
            Welcome to
          </MotiText>
          
          <MotiText
            from={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{
              type: 'timing',
              duration: 800,
              delay: 900,
              easing: Easing.out(Easing.back(1.2)),
            }}
            style={styles.subtitle}
          >
            Wekeyar Dashboard
          </MotiText>
        </MotiView>

        {/* Description */}
        <MotiView
          from={{ translateY: 30, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{
            type: 'timing',
            duration: 800,
            delay: 1200,
            easing: Easing.out(Easing.quad),
          }}
          style={styles.descriptionContainer}
        >
          <Text style={styles.description}>
            Manage your business operations with real-time analytics, customer insights, and seamless order management
          </Text>
        </MotiView>

        {/* Features Section */}
        <MotiView
          from={{ translateY: 40, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{
            type: 'timing',
            duration: 800,
            delay: 1400,
            easing: Easing.out(Easing.quad),
          }}
          style={styles.featuresContainer}
        >
          {[
            '📊 Real-time Analytics',
            '👥 Customer Management', 
            '📱 Order Tracking'
          ].map((feature, index) => (
            <MotiView
              key={index}
              from={{ translateX: -30, opacity: 0 }}
              animate={{ translateX: 0, opacity: 1 }}
              transition={{
                type: 'timing',
                duration: 600,
                delay: 1600 + (index * 200),
                easing: Easing.out(Easing.quad),
              }}
              style={styles.featureItem}
            >
              <Text style={styles.featureText}>{feature}</Text>
            </MotiView>
          ))}
        </MotiView>

        {/* Get Started Button */}
        <MotiView
          from={{ translateY: 50, opacity: 0, scale: 0.8 }}
          animate={{ translateY: 0, opacity: 1, scale: 1 }}
          transition={{
            type: 'timing',
            duration: 1000,
            delay: 2200,
            easing: Easing.out(Easing.back(1.1)),
          }}
          style={styles.buttonContainer}
        >
          <Pressable
            onPress={handleGetStarted}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed
            ]}
          >
            <MotiView
              animate={{
                scale: [1, 1.02, 1],
              }}
              transition={{
                loop: true,
                duration: 2000,
                easing: Easing.inOut(Easing.ease),
              }}
            >
              <LinearGradient
                colors={['#ffffff', '#f8fafc']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.buttonText}>Get Started</Text>
                <Text style={styles.buttonArrow}>→</Text>
              </LinearGradient>
            </MotiView>
          </Pressable>
        </MotiView>

        {/* Bottom Decorative Elements */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            type: 'timing',
            duration: 1000,
            delay: 2800,
          }}
          style={styles.bottomDecoration}
        >
          <View style={styles.decorativeLine} />
          <Text style={styles.versionText}>v1.0.0</Text>
        </MotiView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e40af',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: height * 0.08,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  backgroundElement: {
    position: 'absolute',
  },
  circle: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: height * 0.05,
  },
  logoBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 2,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    color: '#e0e7ff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 1,
  },
  descriptionContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  description: {
    fontSize: 16,
    color: '#bfdbfe',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
  },
  featuresContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  featureItem: {
    marginVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  featureText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 50,
    alignItems: 'center',
  },
  button: {
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  buttonGradient: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    marginRight: 8,
  },
  buttonArrow: {
    fontSize: 20,
    color: '#1e40af',
    fontWeight: 'bold',
  },
  bottomDecoration: {
    alignItems: 'center',
    marginTop: 40,
  },
  decorativeLine: {
    width: 60,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginBottom: 16,
    borderRadius: 1,
  },
  versionText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '400',
  },
});

export default Welcome;