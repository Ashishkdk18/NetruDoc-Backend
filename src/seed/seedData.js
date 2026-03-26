import bcrypt from 'bcryptjs';
import User from '../features/users/models/userModel.js';
import Hospital from '../features/hospitals/models/hospitalModel.js';
import { defaultAvailability } from '../features/users/utils/defaultAvailability.js';

/**
 * Seed data for initial database setup
 */

// Admin user data
export const adminUser = {
  name: 'Admin User',
  email: 'admin@netrudoc.com',
  password: 'Admin@123', // Will be hashed
  role: 'admin',
  phone: '+977-1-1234567',
  address: {
    street: 'Kathmandu',
    city: 'Kathmandu',
    state: 'Bagmati',
    zipCode: '44600',
    country: 'Nepal'
  },
  isActive: true,
  isVerified: true,
  emailVerified: true
};

// Sample doctor users
export const sampleDoctors = [
  {
    name: 'Dr. Rajesh Sharma',
    email: 'rajesh.sharma@netrudoc.com',
    password: 'Doctor@123',
    role: 'doctor',
    phone: '+977-1-2345678',
    address: {
      street: 'Thamel',
      city: 'Kathmandu',
      state: 'Bagmati',
      zipCode: '44600',
      country: 'Nepal'
    },
    specialization: 'cardiology',
    licenseNumber: 'DOC-001-2025',
    experience: 12,
    qualifications: ['MBBS', 'MD Cardiology', 'Fellowship in Interventional Cardiology'],
    qualificationDocuments: [
      {
        name: 'Medical License.pdf',
        url: 'data:application/pdf;base64,JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoxMDAgNzAwIFRkCihTYW1wbGUgTGljZW5zZSBEb2N1bWVudCkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1NCAwMDAwMCBuIAowMDAwMDAwMTAxIDAwMDAwIG4gCjAwMDAwMDAxNzAgMDAwMDAgbiAKMDAwMDAwMDIxOCAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDYKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjI5NAolJUVPRgo=',
        type: 'license',
        uploadedAt: new Date('2024-01-15')
      },
      {
        name: 'MD_Degree.pdf',
        url: 'data:application/pdf;base64,JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoxMDAgNzAwIFRkCihTYW1wbGUgTURfRGVncmVlKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU0IDAwMDAwIG4gCjAwMDAwMDAxMDEgMDAwMDAgbiAKMDAwMDAwMDE3MCAwMDAwMCBuIAowMDAwMDAwMjE4IDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNgovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKMjk0CiUlRU9G',
        type: 'degree',
        uploadedAt: new Date('2020-06-20')
      }
    ],
    hospital: 'Bir Hospital',
    consultationFee: 1500,
    availability: defaultAvailability,
    rating: 4.8,
    totalReviews: 45,
    isActive: true,
    isVerified: true,
    emailVerified: true
  },
  {
    name: 'Dr. Priya Thapa',
    email: 'priya.thapa@netrudoc.com',
    password: 'Doctor@123',
    role: 'doctor',
    phone: '+977-1-3456789',
    address: {
      street: 'Lazimpat',
      city: 'Kathmandu',
      state: 'Bagmati',
      zipCode: '44600',
      country: 'Nepal'
    },
    specialization: 'pediatrics',
    licenseNumber: 'DOC-002-2025',
    experience: 8,
    qualifications: ['MBBS', 'MD Pediatrics', 'Diploma in Child Health'],
    hospital: 'Patan Hospital',
    consultationFee: 1200,
    availability: defaultAvailability,
    rating: 4.9,
    totalReviews: 32,
    isActive: true,
    isVerified: true,
    emailVerified: true
  },
  {
    name: 'Dr. Sunil Rai',
    email: 'sunil.rai@netrudoc.com',
    password: 'Doctor@123',
    role: 'doctor',
    phone: '+977-1-4567890',
    address: {
      street: 'New Road',
      city: 'Kathmandu',
      state: 'Bagmati',
      zipCode: '44600',
      country: 'Nepal'
    },
    specialization: 'orthopedics',
    licenseNumber: 'DOC-003-2025',
    experience: 15,
    qualifications: ['MBBS', 'MS Orthopedics', 'Fellowship in Joint Replacement'],
    hospital: 'Nepal Orthopedic Hospital',
    consultationFee: 1800,
    availability: {
      monday: { start: '08:00', end: '16:00', available: true },
      tuesday: { start: '08:00', end: '16:00', available: true },
      wednesday: { start: '08:00', end: '16:00', available: true },
      thursday: { start: '08:00', end: '16:00', available: true },
      friday: { start: '08:00', end: '16:00', available: true },
      saturday: { start: '08:00', end: '11:00', available: true },
      sunday: { start: '', end: '', available: false }
    },
    rating: 4.7,
    totalReviews: 28,
    isActive: true,
    isVerified: true,
    emailVerified: true
  },
  {
    name: 'Dr. Anjali Pokhrel',
    email: 'anjali.pokhrel@netrudoc.com',
    password: 'Doctor@123',
    role: 'doctor',
    phone: '+977-1-5678901',
    address: {
      street: 'Putalisadak',
      city: 'Kathmandu',
      state: 'Bagmati',
      zipCode: '44600',
      country: 'Nepal'
    },
    specialization: 'dermatology',
    licenseNumber: 'DOC-004-2025',
    experience: 10,
    qualifications: ['MBBS', 'MD Dermatology', 'Diploma in Cosmetic Dermatology'],
    hospital: 'Kathmandu Medical College',
    consultationFee: 1400,
    availability: {
      monday: { start: '11:00', end: '18:00', available: true },
      tuesday: { start: '11:00', end: '18:00', available: true },
      wednesday: { start: '11:00', end: '18:00', available: true },
      thursday: { start: '11:00', end: '18:00', available: true },
      friday: { start: '11:00', end: '18:00', available: true },
      saturday: { start: '11:00', end: '15:00', available: true },
      sunday: { start: '', end: '', available: false }
    },
    rating: 4.6,
    totalReviews: 41,
    isActive: true,
    isVerified: true,
    emailVerified: true
  },
  {
    name: 'Dr. Binod Shrestha',
    email: 'binod.shrestha@netrudoc.com',
    password: 'Doctor@123',
    role: 'doctor',
    phone: '+977-1-6789012',
    address: {
      street: 'Chabahil',
      city: 'Kathmandu',
      state: 'Bagmati',
      zipCode: '44600',
      country: 'Nepal'
    },
    specialization: 'general-medicine',
    licenseNumber: 'DOC-005-2025',
    experience: 20,
    qualifications: ['MBBS', 'MD Internal Medicine', 'Fellowship in Family Medicine'],
    hospital: 'Grande International Hospital',
    consultationFee: 1000,
    availability: {
      monday: { start: '09:00', end: '17:00', available: true },
      tuesday: { start: '09:00', end: '17:00', available: true },
      wednesday: { start: '09:00', end: '17:00', available: true },
      thursday: { start: '09:00', end: '17:00', available: true },
      friday: { start: '09:00', end: '17:00', available: true },
      saturday: { start: '09:00', end: '12:00', available: true },
      sunday: { start: '', end: '', available: false }
    },
    rating: 4.5,
    totalReviews: 67,
    isActive: true,
    isVerified: true,
    emailVerified: true
  },
  {
    name: 'Dr. Maya Gurung',
    email: 'maya.gurung@netrudoc.com',
    password: 'Doctor@123',
    role: 'doctor',
    phone: '+977-1-7890123',
    address: {
      street: 'Bouddha',
      city: 'Kathmandu',
      state: 'Bagmati',
      zipCode: '44600',
      country: 'Nepal'
    },
    specialization: 'gynecology',
    licenseNumber: 'DOC-006-2025',
    experience: 14,
    qualifications: ['MBBS', 'MD Gynecology', 'Fellowship in Reproductive Medicine'],
    hospital: 'Norvic International Hospital',
    consultationFee: 1600,
    availability: {
      monday: { start: '10:00', end: '16:00', available: true },
      tuesday: { start: '10:00', end: '16:00', available: true },
      wednesday: { start: '10:00', end: '16:00', available: true },
      thursday: { start: '10:00', end: '16:00', available: true },
      friday: { start: '10:00', end: '16:00', available: true },
      saturday: { start: '10:00', end: '14:00', available: true },
      sunday: { start: '', end: '', available: false }
    },
    rating: 4.9,
    totalReviews: 53,
    isActive: true,
    isVerified: true,
    emailVerified: true
  }
];

// Nepali hospitals data
export const nepaliHospitals = [
  {
    name: 'Bir Hospital',
    description: 'The oldest hospital in Nepal, established in 1889. A government-run tertiary care hospital.',
    address: {
      street: 'Kantipath',
      city: 'Kathmandu',
      state: 'Bagmati',
      zipCode: '44600',
      country: 'Nepal',
      coordinates: {
        type: 'Point',
        coordinates: [85.3167, 27.7172] // [longitude, latitude]
      }
    },
    contact: {
      phone: '+977-1-4221119',
      email: 'info@birhospital.gov.np',
      website: 'https://birhospital.gov.np',
      emergencyContact: '+977-1-4221119'
    },
    type: 'government',
    specializations: ['general-medicine', 'surgery', 'cardiology', 'orthopedics', 'emergency', 'icu'],
    facilities: [
      { name: 'Emergency Department', available: true },
      { name: 'ICU', available: true },
      { name: 'Operation Theater', available: true },
      { name: 'Laboratory', available: true },
      { name: 'Radiology', available: true },
      { name: 'Pharmacy', available: true }
    ],
    operatingHours: {
      monday: { open: '08:00', close: '17:00', closed: false },
      tuesday: { open: '08:00', close: '17:00', closed: false },
      wednesday: { open: '08:00', close: '17:00', closed: false },
      thursday: { open: '08:00', close: '17:00', closed: false },
      friday: { open: '08:00', close: '17:00', closed: false },
      saturday: { open: '08:00', close: '13:00', closed: false },
      sunday: { open: '08:00', close: '13:00', closed: false }
    },
    emergencyServices: true,
    ambulanceService: true,
    totalBeds: 458,
    availableBeds: 320,
    totalDoctors: 150,
    isVerified: true,
    isActive: true
  },
  {
    name: 'Tribhuvan University Teaching Hospital (TUTH)',
    description: 'Largest teaching hospital in Nepal, affiliated with Tribhuvan University.',
    address: {
      street: 'Maharajgunj',
      city: 'Kathmandu',
      state: 'Bagmati',
      zipCode: '44600',
      country: 'Nepal',
      coordinates: {
        type: 'Point',
        coordinates: [85.3300, 27.7300]
      }
    },
    contact: {
      phone: '+977-1-4412303',
      email: 'info@tuth.edu.np',
      website: 'https://tuth.edu.np',
      emergencyContact: '+977-1-4412303'
    },
    type: 'government',
    specializations: ['general-medicine', 'surgery', 'cardiology', 'neurology', 'pediatrics', 'gynecology', 'emergency', 'icu'],
    facilities: [
      { name: 'Emergency Department', available: true },
      { name: 'ICU', available: true },
      { name: 'NICU', available: true },
      { name: 'Operation Theater', available: true },
      { name: 'Laboratory', available: true },
      { name: 'Radiology', available: true },
      { name: 'Pharmacy', available: true },
      { name: 'Blood Bank', available: true }
    ],
    operatingHours: {
      monday: { open: '08:00', close: '17:00', closed: false },
      tuesday: { open: '08:00', close: '17:00', closed: false },
      wednesday: { open: '08:00', close: '17:00', closed: false },
      thursday: { open: '08:00', close: '17:00', closed: false },
      friday: { open: '08:00', close: '17:00', closed: false },
      saturday: { open: '08:00', close: '13:00', closed: false },
      sunday: { open: '08:00', close: '13:00', closed: false }
    },
    emergencyServices: true,
    ambulanceService: true,
    totalBeds: 700,
    availableBeds: 550,
    totalDoctors: 250,
    isVerified: true,
    isActive: true
  },
  {
    name: 'Nepal Medical College Teaching Hospital',
    description: 'Private medical college and teaching hospital in Kathmandu.',
    address: {
      street: 'Attarkhel, Jorpati',
      city: 'Kathmandu',
      state: 'Bagmati',
      zipCode: '44600',
      country: 'Nepal',
      coordinates: {
        type: 'Point',
        coordinates: [85.3500, 27.7200]
      }
    },
    contact: {
      phone: '+977-1-4911008',
      email: 'info@nmcth.edu.np',
      website: 'https://nmcth.edu.np',
      emergencyContact: '+977-1-4911008'
    },
    type: 'private',
    specializations: ['general-medicine', 'surgery', 'cardiology', 'orthopedics', 'pediatrics', 'emergency', 'icu'],
    facilities: [
      { name: 'Emergency Department', available: true },
      { name: 'ICU', available: true },
      { name: 'Operation Theater', available: true },
      { name: 'Laboratory', available: true },
      { name: 'Radiology', available: true },
      { name: 'Pharmacy', available: true }
    ],
    operatingHours: {
      monday: { open: '08:00', close: '17:00', closed: false },
      tuesday: { open: '08:00', close: '17:00', closed: false },
      wednesday: { open: '08:00', close: '17:00', closed: false },
      thursday: { open: '08:00', close: '17:00', closed: false },
      friday: { open: '08:00', close: '17:00', closed: false },
      saturday: { open: '08:00', close: '13:00', closed: false },
      sunday: { open: '08:00', close: '13:00', closed: false }
    },
    emergencyServices: true,
    ambulanceService: true,
    totalBeds: 400,
    availableBeds: 280,
    totalDoctors: 120,
    isVerified: true,
    isActive: true
  },
  {
    name: 'Patan Hospital',
    description: 'Government hospital in Lalitpur, known for quality healthcare services.',
    address: {
      street: 'Lagankhel',
      city: 'Lalitpur',
      state: 'Bagmati',
      zipCode: '44700',
      country: 'Nepal',
      coordinates: {
        type: 'Point',
        coordinates: [85.3250, 27.6700]
      }
    },
    contact: {
      phone: '+977-1-5522295',
      email: 'info@patanhospital.gov.np',
      website: 'https://patanhospital.gov.np',
      emergencyContact: '+977-1-5522295'
    },
    type: 'government',
    specializations: ['general-medicine', 'surgery', 'cardiology', 'orthopedics', 'pediatrics', 'emergency'],
    facilities: [
      { name: 'Emergency Department', available: true },
      { name: 'ICU', available: true },
      { name: 'Operation Theater', available: true },
      { name: 'Laboratory', available: true },
      { name: 'Radiology', available: true },
      { name: 'Pharmacy', available: true }
    ],
    operatingHours: {
      monday: { open: '08:00', close: '17:00', closed: false },
      tuesday: { open: '08:00', close: '17:00', closed: false },
      wednesday: { open: '08:00', close: '17:00', closed: false },
      thursday: { open: '08:00', close: '17:00', closed: false },
      friday: { open: '08:00', close: '17:00', closed: false },
      saturday: { open: '08:00', close: '13:00', closed: false },
      sunday: { open: '08:00', close: '13:00', closed: false }
    },
    emergencyServices: true,
    ambulanceService: true,
    totalBeds: 350,
    availableBeds: 240,
    totalDoctors: 100,
    isVerified: true,
    isActive: true
  },
  {
    name: 'Grande International Hospital',
    description: 'Modern private hospital in Kathmandu with advanced medical facilities.',
    address: {
      street: 'Tokha Road, Dhapasi',
      city: 'Kathmandu',
      state: 'Bagmati',
      zipCode: '44600',
      country: 'Nepal',
      coordinates: {
        type: 'Point',
        coordinates: [85.3100, 27.7500]
      }
    },
    contact: {
      phone: '+977-1-5159266',
      email: 'info@grandeinternationalhospital.com',
      website: 'https://grandeinternationalhospital.com',
      emergencyContact: '+977-1-5159266'
    },
    type: 'private',
    specializations: ['general-medicine', 'surgery', 'cardiology', 'neurology', 'orthopedics', 'oncology', 'emergency', 'icu'],
    facilities: [
      { name: 'Emergency Department', available: true },
      { name: 'ICU', available: true },
      { name: 'CCU', available: true },
      { name: 'Operation Theater', available: true },
      { name: 'Laboratory', available: true },
      { name: 'Radiology', available: true },
      { name: 'Pharmacy', available: true },
      { name: 'Blood Bank', available: true },
      { name: 'Cath Lab', available: true }
    ],
    operatingHours: {
      monday: { open: '08:00', close: '20:00', closed: false },
      tuesday: { open: '08:00', close: '20:00', closed: false },
      wednesday: { open: '08:00', close: '20:00', closed: false },
      thursday: { open: '08:00', close: '20:00', closed: false },
      friday: { open: '08:00', close: '20:00', closed: false },
      saturday: { open: '08:00', close: '18:00', closed: false },
      sunday: { open: '08:00', close: '18:00', closed: false }
    },
    emergencyServices: true,
    ambulanceService: true,
    totalBeds: 300,
    availableBeds: 200,
    totalDoctors: 80,
    isVerified: true,
    isActive: true
  },
  {
    name: 'Norvic International Hospital',
    description: 'Multi-specialty private hospital in Thapathali, Kathmandu.',
    address: {
      street: 'Thapathali',
      city: 'Kathmandu',
      state: 'Bagmati',
      zipCode: '44600',
      country: 'Nepal',
      coordinates: {
        type: 'Point',
        coordinates: [85.3200, 27.7000]
      }
    },
    contact: {
      phone: '+977-1-4258554',
      email: 'info@norvichospital.com',
      website: 'https://norvichospital.com',
      emergencyContact: '+977-1-4258554'
    },
    type: 'private',
    specializations: ['general-medicine', 'surgery', 'cardiology', 'neurology', 'orthopedics', 'emergency', 'icu'],
    facilities: [
      { name: 'Emergency Department', available: true },
      { name: 'ICU', available: true },
      { name: 'Operation Theater', available: true },
      { name: 'Laboratory', available: true },
      { name: 'Radiology', available: true },
      { name: 'Pharmacy', available: true }
    ],
    operatingHours: {
      monday: { open: '08:00', close: '20:00', closed: false },
      tuesday: { open: '08:00', close: '20:00', closed: false },
      wednesday: { open: '08:00', close: '20:00', closed: false },
      thursday: { open: '08:00', close: '20:00', closed: false },
      friday: { open: '08:00', close: '20:00', closed: false },
      saturday: { open: '08:00', close: '18:00', closed: false },
      sunday: { open: '08:00', close: '18:00', closed: false }
    },
    emergencyServices: true,
    ambulanceService: true,
    totalBeds: 250,
    availableBeds: 180,
    totalDoctors: 70,
    isVerified: true,
    isActive: true
  },
  {
    name: 'Manipal Teaching Hospital',
    description: 'Teaching hospital in Pokhara, affiliated with Manipal College of Medical Sciences.',
    address: {
      street: 'Deep Heights, Pokhara',
      city: 'Pokhara',
      state: 'Gandaki',
      zipCode: '33700',
      country: 'Nepal',
      coordinates: {
        type: 'Point',
        coordinates: [83.9856, 28.2096]
      }
    },
    contact: {
      phone: '+977-61-440600',
      email: 'info@manipal.edu.np',
      website: 'https://manipal.edu.np',
      emergencyContact: '+977-61-440600'
    },
    type: 'private',
    specializations: ['general-medicine', 'surgery', 'cardiology', 'orthopedics', 'pediatrics', 'emergency', 'icu'],
    facilities: [
      { name: 'Emergency Department', available: true },
      { name: 'ICU', available: true },
      { name: 'Operation Theater', available: true },
      { name: 'Laboratory', available: true },
      { name: 'Radiology', available: true },
      { name: 'Pharmacy', available: true }
    ],
    operatingHours: {
      monday: { open: '08:00', close: '17:00', closed: false },
      tuesday: { open: '08:00', close: '17:00', closed: false },
      wednesday: { open: '08:00', close: '17:00', closed: false },
      thursday: { open: '08:00', close: '17:00', closed: false },
      friday: { open: '08:00', close: '17:00', closed: false },
      saturday: { open: '08:00', close: '13:00', closed: false },
      sunday: { open: '08:00', close: '13:00', closed: false }
    },
    emergencyServices: true,
    ambulanceService: true,
    totalBeds: 350,
    availableBeds: 250,
    totalDoctors: 90,
    isVerified: true,
    isActive: true
  },
  {
    name: 'Biratnagar Hospital',
    description: 'Major hospital in Biratnagar, serving eastern Nepal.',
    address: {
      street: 'Biratnagar',
      city: 'Biratnagar',
      state: 'Koshi',
      zipCode: '56613',
      country: 'Nepal',
      coordinates: {
        type: 'Point',
        coordinates: [87.2833, 26.4833]
      }
    },
    contact: {
      phone: '+977-21-520000',
      email: 'info@biratnagarhospital.gov.np',
      website: 'https://biratnagarhospital.gov.np',
      emergencyContact: '+977-21-520000'
    },
    type: 'government',
    specializations: ['general-medicine', 'surgery', 'cardiology', 'orthopedics', 'pediatrics', 'emergency'],
    facilities: [
      { name: 'Emergency Department', available: true },
      { name: 'ICU', available: true },
      { name: 'Operation Theater', available: true },
      { name: 'Laboratory', available: true },
      { name: 'Radiology', available: true },
      { name: 'Pharmacy', available: true }
    ],
    operatingHours: {
      monday: { open: '08:00', close: '17:00', closed: false },
      tuesday: { open: '08:00', close: '17:00', closed: false },
      wednesday: { open: '08:00', close: '17:00', closed: false },
      thursday: { open: '08:00', close: '17:00', closed: false },
      friday: { open: '08:00', close: '17:00', closed: false },
      saturday: { open: '08:00', close: '13:00', closed: false },
      sunday: { open: '08:00', close: '13:00', closed: false }
    },
    emergencyServices: true,
    ambulanceService: true,
    totalBeds: 300,
    availableBeds: 200,
    totalDoctors: 75,
    isVerified: true,
    isActive: true
  },
  {
    name: 'Bharatpur Hospital',
    description: 'Regional hospital in Chitwan, serving central Nepal.',
    address: {
      street: 'Bharatpur',
      city: 'Bharatpur',
      state: 'Bagmati',
      zipCode: '44200',
      country: 'Nepal',
      coordinates: {
        type: 'Point',
        coordinates: [84.4333, 27.6833]
      }
    },
    contact: {
      phone: '+977-56-521000',
      email: 'info@bharatpurhospital.gov.np',
      website: 'https://bharatpurhospital.gov.np',
      emergencyContact: '+977-56-521000'
    },
    type: 'government',
    specializations: ['general-medicine', 'surgery', 'cardiology', 'orthopedics', 'pediatrics', 'emergency'],
    facilities: [
      { name: 'Emergency Department', available: true },
      { name: 'ICU', available: true },
      { name: 'Operation Theater', available: true },
      { name: 'Laboratory', available: true },
      { name: 'Radiology', available: true },
      { name: 'Pharmacy', available: true }
    ],
    operatingHours: {
      monday: { open: '08:00', close: '17:00', closed: false },
      tuesday: { open: '08:00', close: '17:00', closed: false },
      wednesday: { open: '08:00', close: '17:00', closed: false },
      thursday: { open: '08:00', close: '17:00', closed: false },
      friday: { open: '08:00', close: '17:00', closed: false },
      saturday: { open: '08:00', close: '13:00', closed: false },
      sunday: { open: '08:00', close: '13:00', closed: false }
    },
    emergencyServices: true,
    ambulanceService: true,
    totalBeds: 250,
    availableBeds: 170,
    totalDoctors: 60,
    isVerified: true,
    isActive: true
  },
  {
    name: 'Nepalgunj Medical College',
    description: 'Medical college and hospital in Nepalgunj, serving western Nepal.',
    address: {
      street: 'Kohalpur',
      city: 'Nepalgunj',
      state: 'Lumbini',
      zipCode: '21900',
      country: 'Nepal',
      coordinates: {
        type: 'Point',
        coordinates: [81.6167, 28.0500]
      }
    },
    contact: {
      phone: '+977-81-520000',
      email: 'info@nmc.edu.np',
      website: 'https://nmc.edu.np',
      emergencyContact: '+977-81-520000'
    },
    type: 'private',
    specializations: ['general-medicine', 'surgery', 'cardiology', 'orthopedics', 'pediatrics', 'emergency', 'icu'],
    facilities: [
      { name: 'Emergency Department', available: true },
      { name: 'ICU', available: true },
      { name: 'Operation Theater', available: true },
      { name: 'Laboratory', available: true },
      { name: 'Radiology', available: true },
      { name: 'Pharmacy', available: true }
    ],
    operatingHours: {
      monday: { open: '08:00', close: '17:00', closed: false },
      tuesday: { open: '08:00', close: '17:00', closed: false },
      wednesday: { open: '08:00', close: '17:00', closed: false },
      thursday: { open: '08:00', close: '17:00', closed: false },
      friday: { open: '08:00', close: '17:00', closed: false },
      saturday: { open: '08:00', close: '13:00', closed: false },
      sunday: { open: '08:00', close: '13:00', closed: false }
    },
    emergencyServices: true,
    ambulanceService: true,
    totalBeds: 300,
    availableBeds: 220,
    totalDoctors: 80,
    isVerified: true,
    isActive: true
  },
  {
    name: 'Dhulikhel Hospital',
    description: 'University hospital in Dhulikhel, affiliated with Kathmandu University.',
    address: {
      street: 'Dhulikhel',
      city: 'Dhulikhel',
      state: 'Bagmati',
      zipCode: '45200',
      country: 'Nepal',
      coordinates: {
        type: 'Point',
        coordinates: [85.5500, 27.6167]
      }
    },
    contact: {
      phone: '+977-11-490497',
      email: 'info@dhulikhelhospital.org.np',
      website: 'https://dhulikhelhospital.org.np',
      emergencyContact: '+977-11-490497'
    },
    type: 'government',
    specializations: ['general-medicine', 'surgery', 'cardiology', 'orthopedics', 'pediatrics', 'emergency', 'icu'],
    facilities: [
      { name: 'Emergency Department', available: true },
      { name: 'ICU', available: true },
      { name: 'Operation Theater', available: true },
      { name: 'Laboratory', available: true },
      { name: 'Radiology', available: true },
      { name: 'Pharmacy', available: true }
    ],
    operatingHours: {
      monday: { open: '08:00', close: '17:00', closed: false },
      tuesday: { open: '08:00', close: '17:00', closed: false },
      wednesday: { open: '08:00', close: '17:00', closed: false },
      thursday: { open: '08:00', close: '17:00', closed: false },
      friday: { open: '08:00', close: '17:00', closed: false },
      saturday: { open: '08:00', close: '13:00', closed: false },
      sunday: { open: '08:00', close: '13:00', closed: false }
    },
    emergencyServices: true,
    ambulanceService: true,
    totalBeds: 200,
    availableBeds: 140,
    totalDoctors: 50,
    isVerified: true,
    isActive: true
  },
  {
    name: 'Civil Service Hospital',
    description: 'Government hospital in Kathmandu, serving civil servants and general public.',
    address: {
      street: 'Minbhawan',
      city: 'Kathmandu',
      state: 'Bagmati',
      zipCode: '44600',
      country: 'Nepal',
      coordinates: {
        type: 'Point',
        coordinates: [85.3400, 27.7100]
      }
    },
    contact: {
      phone: '+977-1-4780123',
      email: 'info@csh.gov.np',
      website: 'https://csh.gov.np',
      emergencyContact: '+977-1-4780123'
    },
    type: 'government',
    specializations: ['general-medicine', 'surgery', 'cardiology', 'orthopedics', 'pediatrics', 'emergency', 'icu'],
    facilities: [
      { name: 'Emergency Department', available: true },
      { name: 'ICU', available: true },
      { name: 'Operation Theater', available: true },
      { name: 'Laboratory', available: true },
      { name: 'Radiology', available: true },
      { name: 'Pharmacy', available: true }
    ],
    operatingHours: {
      monday: { open: '08:00', close: '17:00', closed: false },
      tuesday: { open: '08:00', close: '17:00', closed: false },
      wednesday: { open: '08:00', close: '17:00', closed: false },
      thursday: { open: '08:00', close: '17:00', closed: false },
      friday: { open: '08:00', close: '17:00', closed: false },
      saturday: { open: '08:00', close: '13:00', closed: false },
      sunday: { open: '08:00', close: '13:00', closed: false }
    },
    emergencyServices: true,
    ambulanceService: true,
    totalBeds: 400,
    availableBeds: 280,
    totalDoctors: 110,
    isVerified: true,
    isActive: true
  },
  {
    name: 'Om Hospital & Research Centre',
    description: 'Private multi-specialty hospital in Chabahil, Kathmandu.',
    address: {
      street: 'Chabahil',
      city: 'Kathmandu',
      state: 'Bagmati',
      zipCode: '44600',
      country: 'Nepal',
      coordinates: {
        type: 'Point',
        coordinates: [85.3500, 27.7200]
      }
    },
    contact: {
      phone: '+977-1-4476225',
      email: 'info@omhospital.com',
      website: 'https://omhospital.com',
      emergencyContact: '+977-1-4476225'
    },
    type: 'private',
    specializations: ['general-medicine', 'surgery', 'cardiology', 'neurology', 'orthopedics', 'emergency', 'icu'],
    facilities: [
      { name: 'Emergency Department', available: true },
      { name: 'ICU', available: true },
      { name: 'Operation Theater', available: true },
      { name: 'Laboratory', available: true },
      { name: 'Radiology', available: true },
      { name: 'Pharmacy', available: true }
    ],
    operatingHours: {
      monday: { open: '08:00', close: '20:00', closed: false },
      tuesday: { open: '08:00', close: '20:00', closed: false },
      wednesday: { open: '08:00', close: '20:00', closed: false },
      thursday: { open: '08:00', close: '20:00', closed: false },
      friday: { open: '08:00', close: '20:00', closed: false },
      saturday: { open: '08:00', close: '18:00', closed: false },
      sunday: { open: '08:00', close: '18:00', closed: false }
    },
    emergencyServices: true,
    ambulanceService: true,
    totalBeds: 200,
    availableBeds: 140,
    totalDoctors: 55,
    isVerified: true,
    isActive: true
  },
  {
    name: 'HAMS Hospital',
    description: 'Private hospital in Kathmandu providing quality healthcare services.',
    address: {
      street: 'Lagankhel',
      city: 'Lalitpur',
      state: 'Bagmati',
      zipCode: '44700',
      country: 'Nepal',
      coordinates: {
        type: 'Point',
        coordinates: [85.3250, 27.6700]
      }
    },
    contact: {
      phone: '+977-1-5522288',
      email: 'info@hamshospital.com',
      website: 'https://hamshospital.com',
      emergencyContact: '+977-1-5522288'
    },
    type: 'private',
    specializations: ['general-medicine', 'surgery', 'cardiology', 'orthopedics', 'pediatrics', 'emergency'],
    facilities: [
      { name: 'Emergency Department', available: true },
      { name: 'ICU', available: true },
      { name: 'Operation Theater', available: true },
      { name: 'Laboratory', available: true },
      { name: 'Radiology', available: true },
      { name: 'Pharmacy', available: true }
    ],
    operatingHours: {
      monday: { open: '08:00', close: '20:00', closed: false },
      tuesday: { open: '08:00', close: '20:00', closed: false },
      wednesday: { open: '08:00', close: '20:00', closed: false },
      thursday: { open: '08:00', close: '20:00', closed: false },
      friday: { open: '08:00', close: '20:00', closed: false },
      saturday: { open: '08:00', close: '18:00', closed: false },
      sunday: { open: '08:00', close: '18:00', closed: false }
    },
    emergencyServices: true,
    ambulanceService: true,
    totalBeds: 180,
    availableBeds: 120,
    totalDoctors: 45,
    isVerified: true,
    isActive: true
  },
  {
    name: 'Medicare National Hospital',
    description: 'Private hospital in Chabahil, Kathmandu.',
    address: {
      street: 'Chabahil',
      city: 'Kathmandu',
      state: 'Bagmati',
      zipCode: '44600',
      country: 'Nepal',
      coordinates: {
        type: 'Point',
        coordinates: [85.3500, 27.7200]
      }
    },
    contact: {
      phone: '+977-1-4476226',
      email: 'info@medicarenational.com',
      website: 'https://medicarenational.com',
      emergencyContact: '+977-1-4476226'
    },
    type: 'private',
    specializations: ['general-medicine', 'surgery', 'cardiology', 'orthopedics', 'emergency'],
    facilities: [
      { name: 'Emergency Department', available: true },
      { name: 'ICU', available: true },
      { name: 'Operation Theater', available: true },
      { name: 'Laboratory', available: true },
      { name: 'Radiology', available: true },
      { name: 'Pharmacy', available: true }
    ],
    operatingHours: {
      monday: { open: '08:00', close: '20:00', closed: false },
      tuesday: { open: '08:00', close: '20:00', closed: false },
      wednesday: { open: '08:00', close: '20:00', closed: false },
      thursday: { open: '08:00', close: '20:00', closed: false },
      friday: { open: '08:00', close: '20:00', closed: false },
      saturday: { open: '08:00', close: '18:00', closed: false },
      sunday: { open: '08:00', close: '18:00', closed: false }
    },
    emergencyServices: true,
    ambulanceService: true,
    totalBeds: 150,
    availableBeds: 100,
    totalDoctors: 35,
    isVerified: true,
    isActive: true
  },
  {
    name: 'Kanti Children\'s Hospital',
    description: 'Specialized pediatric hospital in Kathmandu.',
    address: {
      street: 'Maharajgunj',
      city: 'Kathmandu',
      state: 'Bagmati',
      zipCode: '44600',
      country: 'Nepal',
      coordinates: {
        type: 'Point',
        coordinates: [85.3300, 27.7300]
      }
    },
    contact: {
      phone: '+977-1-4412304',
      email: 'info@kantichildren.gov.np',
      website: 'https://kantichildren.gov.np',
      emergencyContact: '+977-1-4412304'
    },
    type: 'government',
    specializations: ['pediatrics', 'general-medicine', 'surgery', 'emergency', 'icu'],
    facilities: [
      { name: 'Emergency Department', available: true },
      { name: 'NICU', available: true },
      { name: 'PICU', available: true },
      { name: 'Operation Theater', available: true },
      { name: 'Laboratory', available: true },
      { name: 'Radiology', available: true },
      { name: 'Pharmacy', available: true }
    ],
    operatingHours: {
      monday: { open: '08:00', close: '17:00', closed: false },
      tuesday: { open: '08:00', close: '17:00', closed: false },
      wednesday: { open: '08:00', close: '17:00', closed: false },
      thursday: { open: '08:00', close: '17:00', closed: false },
      friday: { open: '08:00', close: '17:00', closed: false },
      saturday: { open: '08:00', close: '13:00', closed: false },
      sunday: { open: '08:00', close: '13:00', closed: false }
    },
    emergencyServices: true,
    ambulanceService: true,
    totalBeds: 200,
    availableBeds: 150,
    totalDoctors: 60,
    isVerified: true,
    isActive: true
  },
  {
    name: 'Sahid Gangalal National Heart Centre',
    description: 'Specialized cardiac care hospital in Kathmandu.',
    address: {
      street: 'Bansbari',
      city: 'Kathmandu',
      state: 'Bagmati',
      zipCode: '44600',
      country: 'Nepal',
      coordinates: {
        type: 'Point',
        coordinates: [85.3400, 27.7400]
      }
    },
    contact: {
      phone: '+977-1-4371388',
      email: 'info@sgnhc.gov.np',
      website: 'https://sgnhc.gov.np',
      emergencyContact: '+977-1-4371388'
    },
    type: 'government',
    specializations: ['cardiology', 'cardiac-surgery', 'emergency', 'icu'],
    facilities: [
      { name: 'Emergency Department', available: true },
      { name: 'CCU', available: true },
      { name: 'ICU', available: true },
      { name: 'Operation Theater', available: true },
      { name: 'Cath Lab', available: true },
      { name: 'Laboratory', available: true },
      { name: 'Radiology', available: true },
      { name: 'Pharmacy', available: true }
    ],
    operatingHours: {
      monday: { open: '08:00', close: '17:00', closed: false },
      tuesday: { open: '08:00', close: '17:00', closed: false },
      wednesday: { open: '08:00', close: '17:00', closed: false },
      thursday: { open: '08:00', close: '17:00', closed: false },
      friday: { open: '08:00', close: '17:00', closed: false },
      saturday: { open: '08:00', close: '13:00', closed: false },
      sunday: { open: '08:00', close: '13:00', closed: false }
    },
    emergencyServices: true,
    ambulanceService: true,
    totalBeds: 150,
    availableBeds: 100,
    totalDoctors: 40,
    isVerified: true,
    isActive: true
  },
  {
    name: 'Tilganga Institute of Ophthalmology',
    description: 'Specialized eye hospital in Kathmandu.',
    address: {
      street: 'Gaushala',
      city: 'Kathmandu',
      state: 'Bagmati',
      zipCode: '44600',
      country: 'Nepal',
      coordinates: {
        type: 'Point',
        coordinates: [85.3500, 27.7000]
      }
    },
    contact: {
      phone: '+977-1-4493774',
      email: 'info@tilganga.org',
      website: 'https://tilganga.org',
      emergencyContact: '+977-1-4493774'
    },
    type: 'private',
    specializations: ['ophthalmology', 'general-medicine', 'emergency'],
    facilities: [
      { name: 'Emergency Department', available: true },
      { name: 'Operation Theater', available: true },
      { name: 'Laboratory', available: true },
      { name: 'Radiology', available: true },
      { name: 'Pharmacy', available: true }
    ],
    operatingHours: {
      monday: { open: '08:00', close: '17:00', closed: false },
      tuesday: { open: '08:00', close: '17:00', closed: false },
      wednesday: { open: '08:00', close: '17:00', closed: false },
      thursday: { open: '08:00', close: '17:00', closed: false },
      friday: { open: '08:00', close: '17:00', closed: false },
      saturday: { open: '08:00', close: '13:00', closed: false },
      sunday: { open: '08:00', close: '13:00', closed: false }
    },
    emergencyServices: true,
    ambulanceService: false,
    totalBeds: 100,
    availableBeds: 70,
    totalDoctors: 25,
    isVerified: true,
    isActive: true
  },
  {
    name: 'Nepal Cancer Hospital',
    description: 'Specialized cancer treatment hospital in Kathmandu.',
    address: {
      street: 'Harisiddhi',
      city: 'Lalitpur',
      state: 'Bagmati',
      zipCode: '44700',
      country: 'Nepal',
      coordinates: {
        type: 'Point',
        coordinates: [85.3200, 27.6500]
      }
    },
    contact: {
      phone: '+977-1-5522289',
      email: 'info@nepalcancerhospital.org',
      website: 'https://nepalcancerhospital.org',
      emergencyContact: '+977-1-5522289'
    },
    type: 'private',
    specializations: ['oncology', 'general-medicine', 'surgery', 'emergency', 'icu'],
    facilities: [
      { name: 'Emergency Department', available: true },
      { name: 'ICU', available: true },
      { name: 'Operation Theater', available: true },
      { name: 'Radiotherapy', available: true },
      { name: 'Chemotherapy', available: true },
      { name: 'Laboratory', available: true },
      { name: 'Radiology', available: true },
      { name: 'Pharmacy', available: true }
    ],
    operatingHours: {
      monday: { open: '08:00', close: '17:00', closed: false },
      tuesday: { open: '08:00', close: '17:00', closed: false },
      wednesday: { open: '08:00', close: '17:00', closed: false },
      thursday: { open: '08:00', close: '17:00', closed: false },
      friday: { open: '08:00', close: '17:00', closed: false },
      saturday: { open: '08:00', close: '13:00', closed: false },
      sunday: { open: '08:00', close: '13:00', closed: false }
    },
    emergencyServices: true,
    ambulanceService: true,
    totalBeds: 120,
    availableBeds: 80,
    totalDoctors: 30,
    isVerified: true,
    isActive: true
  }
];
