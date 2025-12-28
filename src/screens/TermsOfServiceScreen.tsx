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

export default function TermsOfServiceScreen() {
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
        <Text style={styles.title}>Terms of Service</Text>
      </View>

      <View style={styles.introSection}>
        <Text style={styles.introText}>
          Welcome to Hello One Bahrain, operated by Zoom Consultancy, a subsidiary of the Zoom Group of Companies. We provide e-commerce services including product sales, event tickets, merchandise, hotel bookings, lifestyle services, and more. By using our website and app, you agree to all policies outlined in this document.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Introduction</Text>
        <Text style={styles.paragraph}>
          Hello One Bahrain is an e-commerce platform operated by Zoom Consultancy. By accessing and using our services, you agree to be bound by these Terms of Service and all applicable laws and regulations.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Relationship With Partners, Suppliers & Event Organizers</Text>
        <Text style={styles.paragraph}>
          Hello One Bahrain works with authorized suppliers, hotels, event organizers, and distributors. All reseller agreements govern pricing, reporting, marketing approval, and sale conditions. We act as an intermediary between you and these partners.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Ticket Sales Policies</Text>
        <Text style={styles.subsectionTitle}>3.1 Retail Ticket Sales</Text>
        <Text style={styles.paragraph}>
          Tickets are sold at the Face Value set by the event organizer. Customers receive full purchase details via email.
        </Text>
        <Text style={styles.subsectionTitle}>3.2 Wholesale Ticket Sales</Text>
        <Text style={styles.paragraph}>
          Wholesale buyers must sell only at Face Value and avoid scalping. Accurate sales records are required.
        </Text>
        <Text style={styles.subsectionTitle}>3.3 Sales Channels</Text>
        <Text style={styles.paragraph}>
          Tickets may be purchased via our website, email (info@zoombahrain.co), phone, or physical outlets.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Merchandise Sales Policies</Text>
        <Text style={styles.paragraph}>
          Merchandise includes licensed apparel, accessories, collectibles, and official event-related goods. All sales are final unless the item is defective or damaged upon delivery.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. Age Restrictions</Text>
        <Text style={styles.paragraph}>
          • Children under 3 years may attend certain events without a ticket.{'\n'}
          • Children 3–12 require a valid child ticket.{'\n'}
          • Verification of age may be requested at events.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>6. Hotel Booking Policies</Text>
        <Text style={styles.subsectionTitle}>6.1 Reservations</Text>
        <Text style={styles.paragraph}>
          Bookings depend on hotel availability. Breakfast is included. Airport transfers available for 3+ night bookings. Groups of 20+ receive venue transportation.
        </Text>
        <Text style={styles.subsectionTitle}>6.2 Cancellation & Refunds</Text>
        <Text style={styles.paragraph}>
          All hotel bookings are strictly non-refundable.
        </Text>
        <Text style={styles.subsectionTitle}>6.3 No-Show Policy</Text>
        <Text style={styles.paragraph}>
          A no-show results in a 100% charge without refund.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>7. Delivery Policies</Text>
        <Text style={styles.subsectionTitle}>7.1 Ticket Delivery</Text>
        <Text style={styles.paragraph}>
          • Digital tickets: sent via email within 3 business days.{'\n'}
          • Physical tickets: delivered within 3–10 business days.{'\n'}
          • Pickup: available with valid ID.
        </Text>
        <Text style={styles.subsectionTitle}>7.2 Merchandise Delivery</Text>
        <Text style={styles.paragraph}>
          • Local delivery: 2–3 days.{'\n'}
          • International delivery: 10–14 days.{'\n'}
          • Customs fees (if any) are customer responsibility.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>8. Refund, Exchange & Cancellation Policies</Text>
        <Text style={styles.subsectionTitle}>8.1 Ticket Refunds</Text>
        <Text style={styles.paragraph}>
          Refunds only apply if the event is canceled by the organizer.
        </Text>
        <Text style={styles.subsectionTitle}>8.2 Merchandise Returns</Text>
        <Text style={styles.paragraph}>
          Eligible within 14 days if unused and in original packaging. Refunds issued within 5–7 days after inspection.
        </Text>
        <Text style={styles.subsectionTitle}>8.3 Customer Cancellations</Text>
        <Text style={styles.paragraph}>
          Ticket orders cannot be canceled. Merchandise orders may be canceled before shipping.
        </Text>
        <Text style={styles.subsectionTitle}>8.4 Cancellation by Hello One Bahrain</Text>
        <Text style={styles.paragraph}>
          Orders may be canceled due to stock issues, pricing errors, payment failure, or fraud.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>9. E-Commerce Policies</Text>
        <Text style={styles.paragraph}>
          Our e-commerce services include accurate product listings, secure payments, shipping timelines, and exchange options. We strive to provide accurate information and timely delivery.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>10. Advertising & Promotion Standards</Text>
        <Text style={styles.paragraph}>
          All promotions and advertisements must be accurate and approved when necessary. We reserve the right to modify or cancel promotions at any time.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>11. Records & Compliance</Text>
        <Text style={styles.paragraph}>
          Transaction records are kept for 5 years as per local regulations. We comply with all applicable laws and regulations in the Kingdom of Bahrain.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>12. Force Majeure</Text>
        <Text style={styles.paragraph}>
          We are not liable for delays or failures caused by natural disasters, political unrest, pandemics, supply chain disruptions, or other circumstances beyond our reasonable control.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>13. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          Hello One Bahrain's liability is limited to the amount paid by the customer for the specific product or service in question.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>14. Governing Law & Dispute Resolution</Text>
        <Text style={styles.paragraph}>
          These policies are governed by the Laws of the Kingdom of Bahrain. Any disputes will be resolved in accordance with Bahraini law and jurisdiction.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>15. Contact Information</Text>
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
  introSection: {
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
  introText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#374151',
    fontStyle: 'italic',
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
  subsectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    color: '#374151',
    marginBottom: 12,
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










