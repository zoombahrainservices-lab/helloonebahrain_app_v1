import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';

export default function PrivacyPolicyScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>1. Information We Collect</Text>
        <Text style={styles.text}>
          We collect information that you provide directly to us, including your name, email address, 
          phone number, and shipping address when you create an account or place an order.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>2. How We Use Your Information</Text>
        <Text style={styles.text}>
          We use the information we collect to process your orders, communicate with you about your 
          purchases, and improve our services. We do not sell your personal information to third parties.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>3. Data Security</Text>
        <Text style={styles.text}>
          We implement appropriate security measures to protect your personal information. However, 
          no method of transmission over the internet is 100% secure.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>4. Your Rights</Text>
        <Text style={styles.text}>
          You have the right to access, update, or delete your personal information at any time. 
          You can do this through your account settings or by contacting us directly.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>5. Contact Us</Text>
        <Text style={styles.text}>
          If you have any questions about this Privacy Policy, please contact us through the app 
          or via email at support@helloonebahrain.com
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
});
