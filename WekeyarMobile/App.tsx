import {GestureHandlerRootView} from 'react-native-gesture-handler';
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
import StoreReport from './pages/StoreReport';
import UserCreation from './pages/UserCreation';

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

const StoreReportWithLayout = () => (
  <Layout>
    <StoreReport />
  </Layout>
);

const UserCreationWithLayout = () => (
  <Layout>
    <UserCreation />
  </Layout>
);

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
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
            <Stack.Screen 
              name="StoreReport" 
              component={StoreReportWithLayout}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="UserCreation" 
              component={UserCreationWithLayout}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
};

export default App;