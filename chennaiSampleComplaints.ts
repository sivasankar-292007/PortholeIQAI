// Temporary sample pothole locations for the PotholeIQ Chennai map.
// These records provide the fields PublicMap.tsx needs to draw map pins.
// They will not appear until the app's complaint data is connected to this array.

export const chennaiSampleComplaints = [
  {
    id: "CHN-001",
    latitude: 13.0108,
    longitude: 80.2206,
    status: "Pending",
    location: "Guindy, Chennai",
    severity: "High",
    daysIgnored: 5,
    description: "Sample pothole near Guindy",
  },
  {
    id: "CHN-002",
    latitude: 13.0335,
    longitude: 80.2697,
    status: "In Progress",
    location: "Mount Road, Chennai",
    severity: "Medium",
    daysIgnored: 2,
    description: "Sample pothole near Mount Road",
  },
  {
    id: "CHN-003",
    latitude: 13.0067,
    longitude: 80.2565,
    status: "Completed",
    location: "Adyar, Chennai",
    severity: "Low",
    daysIgnored: 0,
    description: "Sample repaired pothole near Adyar",
  },
  {
    id: "CHN-004",
    latitude: 13.0827,
    longitude: 80.2707,
    status: "Pending",
    location: "Chennai Central area",
    severity: "High",
    daysIgnored: 8,
    description: "Sample pothole near Chennai Central",
  },
];
