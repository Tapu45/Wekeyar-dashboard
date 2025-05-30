import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import InactiveCustomerList from './pages/InactiveCustomerList';
import CustomerReport from './pages/customerreport';
import Layout from './ui/Layout';

const Stack = createStackNavigator();
const queryClient = new QueryClient();

// Create wrapped components
const DashboardWithLayout = () => (
  <Layout>
    <Dashboard />
  </Layout>
);

const InactiveCustomerListWithLayout = () => (
  <Layout>
    <InactiveCustomerList />
  </Layout>
);

const CustomerReportWithLayout = () => (
  <Layout>
    <CustomerReport />
  </Layout>
);

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Welcome">
            <Stack.Screen 
              name="Welcome" 
              component={Welcome} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="Login" 
              component={Login} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="Dashboard" 
              component={DashboardWithLayout} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="InactiveCustomerList" 
              component={InactiveCustomerListWithLayout}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="CustomerReport" 
              component={CustomerReportWithLayout}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
};

export default App;