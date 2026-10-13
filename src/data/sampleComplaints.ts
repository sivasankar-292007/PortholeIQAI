import { Complaint, EngineerProfile } from '../types';
import { SAMPLE_IMAGES } from './sampleImages';

// Registered municipal engineers for assignment
export const SAMPLE_ENGINEERS: EngineerProfile[] = [
  {
    id: 'eng-1',
    name: 'Eng. Rajesh Kumar',
    email: 'rajesh.kumar@citycorp.gov',
    department: 'Roads & Asphalt Pavement Div',
    specialization: 'Hot-Mix Bitumen Resurfacing',
    phone: '+91 98765 43210',
    activeTasksCount: 1,
    completedCount: 28,
    rating: 4.8
  },
  {
    id: 'eng-2',
    name: 'Eng. Priya Sharma',
    email: 'priya.sharma@citycorp.gov',
    department: 'Rapid Urban Response Squad',
    specialization: 'Deep Crater Structural Reinforcement',
    phone: '+91 98451 22334',
    activeTasksCount: 1,
    completedCount: 42,
    rating: 4.9
  },
  {
    id: 'eng-3',
    name: 'Eng. Michael Chen',
    email: 'michael.chen@citycorp.gov',
    department: 'Civil Infrastructure Works',
    specialization: 'High-Traffic Arterial Maintenance',
    phone: '+91 97112 34567',
    activeTasksCount: 0,
    completedCount: 31,
    rating: 4.7
  }
];

// Helper to create past ISO timestamps
const daysAgo = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

export const INITIAL_COMPLAINTS: Complaint[] = [
  {
    id: 'PIQ-101',
    reporterId: 'cit-01',
    reporterName: 'Anand Verma',
    reporterEmail: 'anand.v@gmail.com',
    photoUrl: SAMPLE_IMAGES.severePothole,
    latitude: 12.9716,
    longitude: 77.5946,
    address: 'Outer Ring Road, Near Tech Park Junction, Ward 15',
    landmark: 'Opposite Metro Pillar 142',
    ward: 'Ward 15 - East Zone',
    aiPrediction: 'pothole',
    aiConfidence: 0.93,
    estimatedSeverity: 'Dangerous',
    boxCoveragePercent: 22,
    aiDetails: {
      estimatedDepthCm: 11.5,
      hazardRisk: 'Critical',
      analysisMode: 'mobilenet-edge-tensor',
      featuresFound: ['Deep cavity shadow', 'Fractured bitumen edges', 'High contrast rim']
    },
    submittedAt: daysAgo(12),
    status: 'Pending',
    daysIgnored: 12,
    priority: 'Urgent',
    notificationStatus: 'sent'
  },
  {
    id: 'PIQ-102',
    reporterId: 'cit-02',
    reporterName: 'Sunita Rao',
    reporterEmail: 'sunita.rao@outlook.com',
    photoUrl: SAMPLE_IMAGES.moderatePothole,
    latitude: 12.9782,
    longitude: 77.5912,
    address: 'Cubbon Road, Near High Court Gate 4, Ward 8',
    landmark: 'Near Bus Stop 3B',
    ward: 'Ward 8 - Central',
    aiPrediction: 'pothole',
    aiConfidence: 0.88,
    estimatedSeverity: 'Medium',
    boxCoveragePercent: 12,
    aiDetails: {
      estimatedDepthCm: 6.2,
      hazardRisk: 'Moderate',
      analysisMode: 'mobilenet-edge-tensor',
      featuresFound: ['Bitumen depression', 'Transverse surface crack']
    },
    submittedAt: daysAgo(5),
    status: 'Pending',
    daysIgnored: 5,
    priority: 'Normal',
    notificationStatus: 'sent'
  },
  {
    id: 'PIQ-103',
    reporterId: 'cit-03',
    reporterName: 'Karthik Subramanian',
    reporterEmail: 'karthik.s@yahoo.com',
    photoUrl: SAMPLE_IMAGES.moderatePothole,
    latitude: 12.9654,
    longitude: 77.6021,
    address: '100 Feet Road, 4th Block, Indiranagar',
    landmark: 'Outside City Public Library',
    ward: 'Ward 22 - Indiranagar',
    aiPrediction: 'pothole',
    aiConfidence: 0.81,
    estimatedSeverity: 'Low',
    boxCoveragePercent: 5,
    aiDetails: {
      estimatedDepthCm: 3.8,
      hazardRisk: 'Low',
      analysisMode: 'mobilenet-edge-tensor',
      featuresFound: ['Surface chip', 'Minor aggregate stripping']
    },
    submittedAt: daysAgo(7),
    status: 'Completed',
    daysIgnored: 4, // time taken from submit to completion
    assignedEngineerId: 'eng-1',
    assignedEngineerName: 'Eng. Rajesh Kumar',
    assignedEngineerEmail: 'rajesh.kumar@citycorp.gov',
    assignedAt: daysAgo(6),
    repairDeadline: daysAgo(3),
    priority: 'Normal',
    repairStartedAt: daysAgo(5),
    completedAt: daysAgo(3),
    afterPhotoUrl: SAMPLE_IMAGES.repairedRoad,
    repairNotes: 'Milled damaged section 50mm deep, applied tack coat emulsion, laid hot-mix dense asphalt concrete (DAC Grade II), compacted to 98% density. Yellow lane marking re-striped.',
    repairMaterialsUsed: '1.2 tons DAC-Grade II Bitumen, SS-1 Tack Coat, Thermoplastic lane paint',
    qualityRating: 5,
    notificationStatus: 'sent'
  },
  {
    id: 'PIQ-104',
    reporterId: 'cit-04',
    reporterName: 'Deepa Menon',
    reporterEmail: 'deepa.menon@mail.com',
    photoUrl: SAMPLE_IMAGES.moderatePothole,
    latitude: 12.9834,
    longitude: 77.6111,
    address: 'Halasuru Main Road, Opposite Post Office',
    landmark: 'Next to Someshwara Temple lane',
    ward: 'Ward 12 - Halasuru',
    aiPrediction: 'pothole',
    aiConfidence: 0.90,
    estimatedSeverity: 'Medium',
    boxCoveragePercent: 11,
    aiDetails: {
      estimatedDepthCm: 5.5,
      hazardRisk: 'Moderate',
      analysisMode: 'mobilenet-edge-tensor',
      featuresFound: ['Edge breakup', 'Sub-base moisture penetration']
    },
    submittedAt: daysAgo(2),
    status: 'Assigned',
    daysIgnored: 2,
    assignedEngineerId: 'eng-1',
    assignedEngineerName: 'Eng. Rajesh Kumar',
    assignedEngineerEmail: 'rajesh.kumar@citycorp.gov',
    assignedAt: daysAgo(1),
    repairDeadline: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    priority: 'High',
    officerNotes: 'High bike transit during peak morning hours. Ensure cold-mix or hot-mix patch before rain.',
    notificationStatus: 'sent'
  },
  {
    id: 'PIQ-105',
    reporterId: 'cit-05',
    reporterName: 'Suresh Babu',
    reporterEmail: 'suresh.b@gmail.com',
    photoUrl: SAMPLE_IMAGES.severePothole,
    latitude: 12.9550,
    longitude: 77.5850,
    address: 'Kanakapura Main Road, Near Metro Station Pillar 88',
    landmark: 'Near South City Crossing',
    ward: 'Ward 33 - South',
    aiPrediction: 'pothole',
    aiConfidence: 0.86,
    estimatedSeverity: 'Dangerous',
    boxCoveragePercent: 20,
    aiDetails: {
      estimatedDepthCm: 10.2,
      hazardRisk: 'Severe',
      analysisMode: 'mobilenet-edge-tensor',
      featuresFound: ['Large cavity', 'Sub-base exposure', 'Vehicle tire strike risk']
    },
    submittedAt: daysAgo(1),
    status: 'In Progress',
    daysIgnored: 1,
    assignedEngineerId: 'eng-2',
    assignedEngineerName: 'Eng. Priya Sharma',
    assignedEngineerEmail: 'priya.sharma@citycorp.gov',
    assignedAt: daysAgo(1),
    repairDeadline: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    priority: 'Urgent',
    officerNotes: 'Immediate road safety hazard for two-wheelers. Prioritize rapid patching.',
    repairStartedAt: daysAgo(0),
    notificationStatus: 'sent'
  }
];
