import React from 'react';
import { View, StyleSheet } from 'react-native';
import CustomNavbar from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
  showNavbar?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showNavbar = true }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {children}
      </View>
      {showNavbar && <CustomNavbar />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
});

export default Layout;