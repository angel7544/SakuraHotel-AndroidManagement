import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import { supabase } from './supabase';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      Alert.alert('Error', 'Failed to get push token for push notification!');
      return;
    }
    
    try {
      // 1. Get Expo Push Token
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId ?? '415c3c32-6aee-42e3-9234-1da0c844cd00';

      token = (await Notifications.getExpoPushTokenAsync({
        projectId
      })).data;
      console.log("Expo Push Token:", token);
      
      // 2. Get FCM Token (Optional, for direct Firebase usage)
      let fcmToken = null;
      try {
        if (Platform.OS === 'android') {
           // On Android, we can try to get the device push token
           // Note: This might throw if not properly configured with google-services.json
           // We wrap it in try/catch so it doesn't block the main Expo token
           // Only attempt if we are in a build that supports it
           if (Constants.appOwnership !== 'expo') {
              const deviceTokenData = await Notifications.getDevicePushTokenAsync();
              fcmToken = deviceTokenData.data;
              console.log("FCM Token:", fcmToken);
           }
        }
      } catch (fcmError) {
        // Suppress the specific "Default FirebaseApp is not initialized" error from alerting the user
        // as it just means they haven't set up Firebase yet, but Expo Push Token will still work.
        console.log("FCM Token skipped (not critical):", fcmError);
      }
  
      // 3. Save to Database
      if (token) {
        const { error } = await supabase
          .from('push_tokens')
          .upsert({ 
            token: token, 
            platform: Platform.OS,
            fcm_token: fcmToken
          }, { onConflict: 'token', ignoreDuplicates: false }); 
          
        if (error) {
          console.error('Error saving push token:', error);
          // Only alert if it's a real error, not just a network blip
          if (error.code !== 'PGRST116') { // PGRST116 is "The result contains 0 rows" which shouldn't happen on upsert
              Alert.alert('Registration Error', 'Could not save push token to database: ' + error.message);
          }
        } else {
          console.log('Push token saved successfully to Supabase');
        }
      }
    } catch (error: any) {
      console.error("Error getting push token:", error);
      Alert.alert('Token Error', 'Failed to get push token: ' + error.message);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}
