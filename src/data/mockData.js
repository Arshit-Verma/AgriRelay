export const officerProfiles = [
  {
    id: 'officer-001',
    name: 'Ananya Patil',
    zone: 'Nashik North',
    district: 'Nashik',
    cropsManaged: ['Onion', 'Tomato', 'Grapes'],
  },
  {
    id: 'officer-002',
    name: 'Rahul Meena',
    zone: 'Kota Canal Belt',
    district: 'Kota',
    cropsManaged: ['Soybean', 'Wheat', 'Coriander'],
  },
  {
    id: 'officer-003',
    name: 'Farida Begum',
    zone: 'Guntur Delta',
    district: 'Guntur',
    cropsManaged: ['Chilli', 'Paddy', 'Turmeric'],
  },
  {
    id: 'officer-004',
    name: 'Kavya Rao',
    zone: 'Kolar',
    district: 'Kolar',
    cropsManaged: ['Tomato', 'Ragi', 'Beans'],
  },
  {
    id: 'officer-005',
    name: 'Manjunath Gowda',
    zone: 'Tumkur',
    district: 'Tumakuru',
    cropsManaged: ['Coconut', 'Arecanut', 'Groundnut'],
  },
  {
    id: 'officer-006',
    name: 'Nandini Hegde',
    zone: 'Hassan',
    district: 'Hassan',
    cropsManaged: ['Coffee', 'Paddy', 'Pepper'],
  },
  {
    id: 'officer-007',
    name: 'Suresh Kumar',
    zone: 'Mandya',
    district: 'Mandya',
    cropsManaged: ['Sugarcane', 'Paddy', 'Ragi'],
  },
];

export const mandis = [
  { id: 'm-001', name: 'Lasalgaon APMC', lat: 20.142, lng: 74.239, currentPrice: 1620, predictedPrice: 1840, supplyTrustScore: 88, crop: 'Onion' },
  { id: 'm-002', name: 'Pimpalgaon Baswant', lat: 20.166, lng: 73.987, currentPrice: 1480, predictedPrice: 1715, supplyTrustScore: 81, crop: 'Tomato' },
  { id: 'm-003', name: 'Nashik Market Yard', lat: 19.997, lng: 73.789, currentPrice: 3850, predictedPrice: 4025, supplyTrustScore: 92, crop: 'Grapes' },
  { id: 'm-004', name: 'Kota Krishi Upaj Mandi', lat: 25.213, lng: 75.864, currentPrice: 4340, predictedPrice: 4210, supplyTrustScore: 76, crop: 'Soybean' },
  { id: 'm-005', name: 'Ramganj Mandi', lat: 24.646, lng: 75.944, currentPrice: 6920, predictedPrice: 7210, supplyTrustScore: 84, crop: 'Coriander' },
  { id: 'm-006', name: 'Guntur Mirchi Yard', lat: 16.306, lng: 80.436, currentPrice: 13200, predictedPrice: 14150, supplyTrustScore: 73, crop: 'Chilli' },
  { id: 'm-007', name: 'Tenali Market Yard', lat: 16.242, lng: 80.64, currentPrice: 2180, predictedPrice: 2325, supplyTrustScore: 79, crop: 'Paddy' },
  { id: 'm-008', name: 'Duggirala Turmeric Yard', lat: 16.323, lng: 80.617, currentPrice: 7450, predictedPrice: 7810, supplyTrustScore: 86, crop: 'Turmeric' },
];

export const harvestRecommendations = [
  { id: 'h-001', crop: 'Onion', zone: 'Nashik North', daysToOptimalHarvest: 9, confidence: 87 },
  { id: 'h-002', crop: 'Tomato', zone: 'Nashik North', daysToOptimalHarvest: 4, confidence: 82 },
  { id: 'h-003', crop: 'Soybean', zone: 'Kota Canal Belt', daysToOptimalHarvest: 16, confidence: 78 },
  { id: 'h-004', crop: 'Chilli', zone: 'Guntur Delta', daysToOptimalHarvest: 11, confidence: 91 },
  { id: 'h-005', crop: 'Paddy', zone: 'Guntur Delta', daysToOptimalHarvest: 21, confidence: 74 },
];

export const farmers = [
  { id: 'f-001', name: 'Vilas Jadhav', village: 'Niphad', phone: '+91 98765 12001', crop: 'Onion', acreage: 3.5 },
  { id: 'f-002', name: 'Savitri More', village: 'Chandori', phone: '+91 98765 12002', crop: 'Tomato', acreage: 2 },
  { id: 'f-003', name: 'Ganesh Pawar', village: 'Ojhar', phone: '+91 98765 12003', crop: 'Grapes', acreage: 4.25 },
  { id: 'f-004', name: 'Meera Shinde', village: 'Lasalgaon', phone: '+91 98765 12004', crop: 'Onion', acreage: 2.75 },
  { id: 'f-005', name: 'Iqbal Shaikh', village: 'Palkhed', phone: '+91 98765 12005', crop: 'Tomato', acreage: 1.8 },
  { id: 'f-006', name: 'Harish Gurjar', village: 'Borkhera', phone: '+91 98765 12006', crop: 'Soybean', acreage: 5 },
  { id: 'f-007', name: 'Kamla Bai', village: 'Sangod', phone: '+91 98765 12007', crop: 'Wheat', acreage: 3.2 },
  { id: 'f-008', name: 'Prasad Reddy', village: 'Duggirala', phone: '+91 98765 12008', crop: 'Turmeric', acreage: 2.6 },
  { id: 'f-009', name: 'Lakshmi Devi', village: 'Tenali', phone: '+91 98765 12009', crop: 'Paddy', acreage: 4.8 },
  { id: 'f-010', name: 'Nagesh Rao', village: 'Pedakakani', phone: '+91 98765 12010', crop: 'Chilli', acreage: 3.9 },
];

export const contaminationFlags = [
  { id: 'c-001', crop: 'Tomato', location: 'Chandori cluster', lat: 20.072, lng: 73.918, severity: 'medium', date: '2026-06-08', batchId: 'NSK-TOM-260608-A' },
  { id: 'c-002', crop: 'Onion', location: 'Lasalgaon east sheds', lat: 20.139, lng: 74.248, severity: 'low', date: '2026-06-10', batchId: 'NSK-ONI-260610-C' },
  { id: 'c-003', crop: 'Chilli', location: 'Guntur drying yard 4', lat: 16.309, lng: 80.451, severity: 'high', date: '2026-06-11', batchId: 'GNT-CHI-260611-B' },
  { id: 'c-004', crop: 'Paddy', location: 'Tenali intake point', lat: 16.247, lng: 80.641, severity: 'medium', date: '2026-06-12', batchId: 'GNT-PAD-260612-D' },
];

export const govtSchemes = [
  { id: 's-001', name: 'PM-Kisan Income Support', deadline: '2026-07-15', eligibleCrops: ['All registered crops'], benefitAmount: '₹6,000/year' },
  { id: 's-002', name: 'MIDH Drip Irrigation Subsidy', deadline: '2026-08-01', eligibleCrops: ['Grapes', 'Tomato', 'Chilli'], benefitAmount: 'Up to 55% equipment subsidy' },
  { id: 's-003', name: 'Onion Storage Structure Assistance', deadline: '2026-06-30', eligibleCrops: ['Onion'], benefitAmount: '₹87,500 per unit' },
  { id: 's-004', name: 'RKVY Market Linkage Grant', deadline: '2026-09-10', eligibleCrops: ['Soybean', 'Coriander', 'Turmeric'], benefitAmount: '₹25,000 per FPO member cluster' },
  { id: 's-005', name: 'Paddy Mechanisation Support', deadline: '2026-07-28', eligibleCrops: ['Paddy'], benefitAmount: '40% machinery subsidy' },
  { id: 's-006', name: 'Spice Quality Certification Scheme', deadline: '2026-08-20', eligibleCrops: ['Chilli', 'Turmeric', 'Coriander'], benefitAmount: '₹12,000 testing support' },
];

export const priceTrend = [
  { week: 'W1', onion: 1320, tomato: 980, chilli: 12100 },
  { week: 'W2', onion: 1410, tomato: 1120, chilli: 12650 },
  { week: 'W3', onion: 1530, tomato: 1260, chilli: 13050 },
  { week: 'W4', onion: 1620, tomato: 1480, chilli: 13200 },
  { week: 'W5', onion: 1840, tomato: 1715, chilli: 14150 },
];
