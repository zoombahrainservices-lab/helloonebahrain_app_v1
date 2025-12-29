import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';

export default function TermsOfServiceScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>1. Acceptance of Terms</Text>
        <Text style={styles.text}>
          By accessing and using this application, you accept and agree to be bound by the terms 
          and provision of this agreement.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>2. Use License</Text>
        <Text style={styles.text}>
          Permission is granted to temporarily use this application for personal, non-commercial 
          transitory viewing only. This is the grant of a license, not a transfer of title.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>3. Orders and Payment</Text>
        <Text style={styles.text}>
          When you place an order, you agree to provide accurate and complete information. 
          Payment must be made in full before your order is processed. We reserve the right to 
          refuse or cancel any order at our discretion.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>4. Product Information</Text>
        <Text style={styles.text}>
          We strive to provide accurate product descriptions and images. However, we do not warrant 
          that product descriptions or other content is accurate, complete, reliable, or error-free.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>5. Limitation of Liability</Text>
        <Text style={styles.text}>
          In no event shall HelloOneBahrain or its suppliers be liable for any damages arising out 
          of the use or inability to use the application, even if we have been notified of the 
          possibility of such damage.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>6. Contact Information</Text>
        <Text style={styles.text}>
          If you have any questions about these Terms of Service, please contact us through the app 
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
