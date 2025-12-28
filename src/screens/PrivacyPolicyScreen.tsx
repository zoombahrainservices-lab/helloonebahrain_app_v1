import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#dc2626" />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>
          We collect the following information to provide you with our services:
        </Text>
        <Text style={styles.bulletPoint}>• Name, phone number, and email address</Text>
        <Text style={styles.bulletPoint}>• Physical address for delivery</Text>
        <Text style={styles.bulletPoint}>• Payment details (processed securely through payment gateways)</Text>
        <Text style={styles.bulletPoint}>• Device information and IP address</Text>
        <Text style={styles.bulletPoint}>• Browsing data and app usage patterns</Text>
        <Text style={styles.bulletPoint}>• Purchase history and preferences</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. How We Use Your Data</Text>
        <Text style={styles.paragraph}>
          We use your personal information for the following purposes:
        </Text>
        <Text style={styles.bulletPoint}>• To process and fulfill your orders</Text>
        <Text style={styles.bulletPoint}>• To improve our services and user experience</Text>
        <Text style={styles.bulletPoint}>• To prevent fraud and ensure security</Text>
        <Text style={styles.bulletPoint}>• To communicate with you about your orders and account</Text>
        <Text style={styles.bulletPoint}>• To send promotional offers (with your consent)</Text>
        <Text style={styles.bulletPoint}>• To meet legal and regulatory requirements</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Data Protection Measures</Text>
        <Text style={styles.paragraph}>
          We implement industry-standard security measures to protect your data:
        </Text>
        <Text style={styles.bulletPoint}>• SSL encryption for all data transmission</Text>
        <Text style={styles.bulletPoint}>• Secure servers with restricted access</Text>
        <Text style={styles.bulletPoint}>• Regular security audits and updates</Text>
        <Text style={styles.bulletPoint}>• Limited access to personal data on a need-to-know basis</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Data Sharing</Text>
        <Text style={styles.paragraph}>
          We do not sell your personal data. We may share your information only with:
        </Text>
        <Text style={styles.bulletPoint}>• Payment gateways for transaction processing</Text>
        <Text style={styles.bulletPoint}>• Delivery partners for order fulfillment</Text>
        <Text style={styles.bulletPoint}>• Event organizers for ticket validation</Text>
        <Text style={styles.bulletPoint}>• Hotel partners for booking confirmation</Text>
        <Text style={styles.bulletPoint}>• Legal authorities when required by law</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. Your Rights</Text>
        <Text style={styles.paragraph}>
          You have the following rights regarding your personal data:
        </Text>
        <Text style={styles.bulletPoint}>• Access your personal information</Text>
        <Text style={styles.bulletPoint}>• Request correction of inaccurate data</Text>
        <Text style={styles.bulletPoint}>• Request deletion of your data</Text>
        <Text style={styles.bulletPoint}>• Opt-out of marketing communications</Text>
        <Text style={styles.bulletPoint}>• Withdraw consent at any time</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>6. Data Retention</Text>
        <Text style={styles.paragraph}>
          We retain your personal data for 5 years for compliance purposes, as required by local regulations. After this period, your data will be securely deleted or anonymized.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>7. Cookies Policy</Text>
        <Text style={styles.paragraph}>
          We use cookies and similar technologies to:
        </Text>
        <Text style={styles.bulletPoint}>• Analyze app usage and performance</Text>
        <Text style={styles.bulletPoint}>• Personalize your experience</Text>
        <Text style={styles.bulletPoint}>• Remember your preferences</Text>
        <Text style={styles.paragraph}>
          You may disable cookies in your device settings at any time, though this may affect app functionality.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <Text style={styles.paragraph}>
          If you have questions about this Privacy Policy, please contact us:
        </Text>
        <Text style={styles.contactText}>
          Hello One Bahrain – Zoom Consultancy{'\n'}
          Email: info@zoombahrain.co{'\n'}
          Phone: +973 38816222{'\n'}
          Address: Office No. 12, Building 656, Road 3625, Block 336, Adliya, Manama, Bahrain
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Last updated: {new Date().toLocaleDateString()}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    color: '#374151',
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 15,
    lineHeight: 24,
    color: '#374151',
    marginLeft: 8,
    marginBottom: 8,
  },
  contactText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#374151',
    marginTop: 8,
  },
  footer: {
    marginTop: 16,
    marginBottom: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
});










