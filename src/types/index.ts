export type UserRole = 'citizen' | 'officer' | 'engineer' | 'public';

export type ComplaintStatus = 'Pending' | 'Assigned' | 'In Progress' | 'Completed' | 'Rejected';

export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Dangerous';

export type RoadClassification = 'pothole' | 'normal_road';

export type PriorityLevel = 'Normal' | 'High' | 'Urgent';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  ward?: string;
  department?: string;
  specialization?: string;
  phone?: string;
  avatar?: string;
}

export interface AIDetectionResult {
  classification: RoadClassification;
  confidence: number; // 0 to 1
  severity: SeverityLevel;
  boxCoveragePercent: number; // percentage of image damaged
  estimatedDepthCm?: number;
  hazardRisk: 'Low' | 'Moderate' | 'Severe' | 'Critical';
  analysisMode: 'mobilenet-edge-tensor' | 'gemini-vision-ai';
  surfaceType?: string;
  featuresFound: string[];
  rejectionReason?: string;
}

export interface Complaint {
  id: string; // e.g. #PIQ-101
  reporterId: string;
  reporterName: string;
  reporterEmail?: string;
  photoUrl: string;
  latitude: number;
  longitude: number;
  address: string;
  landmark?: string;
  ward?: string;
  
  // AI metadata
  aiPrediction: RoadClassification;
  aiConfidence: number; // e.g. 0.92
  estimatedSeverity: SeverityLevel;
  boxCoveragePercent: number;
  aiDetails?: {
    estimatedDepthCm?: number;
    hazardRisk?: string;
    analysisMode?: string;
    featuresFound?: string[];
  };

  // Lifecycle
  submittedAt: string; // ISO date string
  status: ComplaintStatus;
  daysIgnored: number; // calculated dynamically
  
  // Officer assignment
  assignedEngineerId?: string;
  assignedEngineerName?: string;
  assignedEngineerEmail?: string;
  assignedAt?: string;
  repairDeadline?: string;
  priority: PriorityLevel;
  officerNotes?: string;

  // Engineer repair
  repairStartedAt?: string;
  completedAt?: string;
  afterPhotoUrl?: string;
  repairNotes?: string;
  repairMaterialsUsed?: string;
  qualityRating?: number;

  // Notifications
  notificationStatus: 'sent' | 'pending' | 'mock_dispatched';
  rejectionReason?: string;
}

export interface EngineerProfile {
  id: string;
  name: string;
  email: string;
  department: string;
  specialization: string;
  phone: string;
  activeTasksCount: number;
  completedCount: number;
  rating: number;
}

export interface EmailNotificationLog {
  id: string;
  complaintId: string;
  recipientEmail: string;
  subject: string;
  body: string;
  sentAt: string;
  status: 'delivered' | 'pending' | 'simulated' | 'sent' | 'failed';
  errorMessage?: string;
  complaintData?: {
    complaintId?: string;
    reporterName: string;
    severity: string;
    aiConfidence: number;
    latitude: number;
    longitude: number;
    photoUrl: string;
    address?: string;
  };
  eventType: 'complaint_submitted' | 'engineer_assigned' | 'repair_completed';
}

export interface InAppNotification {
  id: string;
  recipientId: string;
  senderId: string;
  title: string;
  message: string;
  type:
    | 'complaint_submitted'
    | 'engineer_assigned'
    | 'repair_started'
    | 'repair_completed'
    | 'complaint_reopened'
    | 'status_update'
    | 'urgent_alert';
  complaintId: string;
  read: boolean;
  createdAt: string;
}
