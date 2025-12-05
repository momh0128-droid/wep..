// Mock patient data for ICU Smart Control System
const patientsData = [
    {
        id: 1,
        name: "Ahmed Hassan",
        age: 58,
        bedId: "ICU-101",
        status: "critical",
        vitals: {
            heartRate: 125,
            spo2: 88,
            bloodPressure: { systolic: 160, diastolic: 95 },
            temperature: 38.5,
            respiratoryRate: 28
        },
        medications: [
            { name: "Norepinephrine", dose: "0.1 mcg/kg/min", nextDose: "14:30", status: "active" },
            { name: "Propofol", dose: "50 mg/hr", nextDose: "15:00", status: "active" },
            { name: "Ceftriaxone", dose: "2g IV", nextDose: "16:00", status: "pending" }
        ],
        admissionDate: "2025-12-03",
        diagnosis: "Septic Shock"
    },
    {
        id: 2,
        name: "Fatima Ali",
        age: 42,
        bedId: "ICU-102",
        status: "stable",
        vitals: {
            heartRate: 78,
            spo2: 98,
            bloodPressure: { systolic: 120, diastolic: 75 },
            temperature: 36.8,
            respiratoryRate: 16
        },
        medications: [
            { name: "Aspirin", dose: "100mg", nextDose: "18:00", status: "scheduled" },
            { name: "Atorvastatin", dose: "40mg", nextDose: "20:00", status: "scheduled" }
        ],
        admissionDate: "2025-12-01",
        diagnosis: "Post-MI Monitoring"
    },
    {
        id: 3,
        name: "Mohamed Saeed",
        age: 65,
        bedId: "ICU-103",
        status: "warning",
        vitals: {
            heartRate: 105,
            spo2: 92,
            bloodPressure: { systolic: 145, diastolic: 88 },
            temperature: 37.8,
            respiratoryRate: 22
        },
        medications: [
            { name: "Furosemide", dose: "40mg IV", nextDose: "14:45", status: "due" },
            { name: "Metoprolol", dose: "25mg", nextDose: "16:00", status: "scheduled" }
        ],
        admissionDate: "2025-12-02",
        diagnosis: "Acute Heart Failure"
    },
    {
        id: 4,
        name: "Sara Ibrahim",
        age: 35,
        bedId: "ICU-104",
        status: "stable",
        vitals: {
            heartRate: 72,
            spo2: 99,
            bloodPressure: { systolic: 115, diastolic: 70 },
            temperature: 36.5,
            respiratoryRate: 14
        },
        medications: [
            { name: "Insulin", dose: "4 units/hr", nextDose: "Continuous", status: "active" },
            { name: "Vancomycin", dose: "1g IV", nextDose: "20:00", status: "scheduled" }
        ],
        admissionDate: "2025-11-30",
        diagnosis: "DKA - Recovering"
    },
    {
        id: 5,
        name: "Khaled Mahmoud",
        age: 71,
        bedId: "ICU-105",
        status: "stable",
        vitals: {
            heartRate: 68,
            spo2: 96,
            bloodPressure: { systolic: 128, diastolic: 78 },
            temperature: 36.9,
            respiratoryRate: 15
        },
        medications: [
            { name: "Heparin", dose: "1000 units/hr", nextDose: "Continuous", status: "active" },
            { name: "Pantoprazole", dose: "40mg IV", nextDose: "08:00", status: "scheduled" }
        ],
        admissionDate: "2025-12-04",
        diagnosis: "Post-Operative Monitoring"
    },
    {
        id: 6,
        name: "Layla Hassan",
        age: 29,
        bedId: "ICU-106",
        status: "warning",
        vitals: {
            heartRate: 110,
            spo2: 94,
            bloodPressure: { systolic: 135, diastolic: 85 },
            temperature: 37.5,
            respiratoryRate: 20
        },
        medications: [
            { name: "Magnesium Sulfate", dose: "2g IV", nextDose: "15:30", status: "due" },
            { name: "Labetalol", dose: "20mg IV", nextDose: "16:00", status: "scheduled" }
        ],
        admissionDate: "2025-12-04",
        diagnosis: "Severe Preeclampsia"
    },
    {
        id: 7,
        name: "Omar Youssef",
        age: 55,
        bedId: "ICU-107",
        status: "stable",
        vitals: {
            heartRate: 75,
            spo2: 97,
            bloodPressure: { systolic: 122, diastolic: 76 },
            temperature: 36.7,
            respiratoryRate: 16
        },
        medications: [
            { name: "Piperacillin", dose: "4.5g IV", nextDose: "18:00", status: "scheduled" },
            { name: "Acetaminophen", dose: "650mg", nextDose: "17:00", status: "scheduled" }
        ],
        admissionDate: "2025-12-03",
        diagnosis: "Pneumonia"
    },
    {
        id: 8,
        name: "Nour Ahmed",
        age: 48,
        bedId: "ICU-108",
        status: "stable",
        vitals: {
            heartRate: 80,
            spo2: 98,
            bloodPressure: { systolic: 118, diastolic: 72 },
            temperature: 36.6,
            respiratoryRate: 15
        },
        medications: [
            { name: "Enoxaparin", dose: "40mg SC", nextDose: "08:00", status: "scheduled" },
            { name: "Ondansetron", dose: "4mg IV", nextDose: "PRN", status: "prn" }
        ],
        admissionDate: "2025-12-02",
        diagnosis: "Post-Stroke Monitoring"
    },
    {
        id: 9,
        name: "Youssef Kamal",
        age: 62,
        bedId: "ICU-109",
        status: "warning",
        vitals: {
            heartRate: 98,
            spo2: 91,
            bloodPressure: { systolic: 150, diastolic: 92 },
            temperature: 38.2,
            respiratoryRate: 24
        },
        medications: [
            { name: "Meropenem", dose: "1g IV", nextDose: "14:20", status: "overdue" },
            { name: "Hydrocortisone", dose: "100mg IV", nextDose: "16:00", status: "scheduled" }
        ],
        admissionDate: "2025-12-04",
        diagnosis: "COPD Exacerbation"
    },
    {
        id: 10,
        name: "Mona Salah",
        age: 39,
        bedId: "ICU-110",
        status: "stable",
        vitals: {
            heartRate: 70,
            spo2: 99,
            bloodPressure: { systolic: 110, diastolic: 68 },
            temperature: 36.4,
            respiratoryRate: 14
        },
        medications: [
            { name: "Fentanyl", dose: "50 mcg/hr", nextDose: "Continuous", status: "active" },
            { name: "Midazolam", dose: "2 mg/hr", nextDose: "Continuous", status: "active" }
        ],
        admissionDate: "2025-12-01",
        diagnosis: "Post-Surgical - Sedated"
    },
    {
        id: 11,
        name: "Hassan Farid",
        age: 77,
        bedId: "ICU-111",
        status: "stable",
        vitals: {
            heartRate: 65,
            spo2: 95,
            bloodPressure: { systolic: 125, diastolic: 75 },
            temperature: 36.8,
            respiratoryRate: 16
        },
        medications: [
            { name: "Digoxin", dose: "0.125mg", nextDose: "08:00", status: "scheduled" },
            { name: "Warfarin", dose: "5mg", nextDose: "18:00", status: "scheduled" }
        ],
        admissionDate: "2025-11-29",
        diagnosis: "Atrial Fibrillation"
    },
    {
        id: 12,
        name: "Amira Nabil",
        age: 52,
        bedId: "ICU-112",
        status: "stable",
        vitals: {
            heartRate: 76,
            spo2: 97,
            bloodPressure: { systolic: 120, diastolic: 74 },
            temperature: 36.9,
            respiratoryRate: 15
        },
        medications: [
            { name: "Levothyroxine", dose: "100mcg", nextDose: "08:00", status: "scheduled" },
            { name: "Metformin", dose: "500mg", nextDose: "12:00", status: "scheduled" }
        ],
        admissionDate: "2025-12-03",
        diagnosis: "Diabetic Monitoring"
    }
];

// Alert/Notification data
const alertsData = [
    {
        id: 1,
        type: "critical",
        patientId: 1,
        patientName: "Ahmed Hassan",
        bedId: "ICU-101",
        title: "Critical Vitals Alert",
        message: "SpO2 dropped to 88%. Immediate attention required.",
        time: "2 min ago",
        timestamp: Date.now() - 120000
    },
    {
        id: 2,
        type: "warning",
        patientId: 9,
        patientName: "Youssef Kamal",
        bedId: "ICU-109",
        title: "Medication Overdue",
        message: "Meropenem dose is 10 minutes overdue.",
        time: "10 min ago",
        timestamp: Date.now() - 600000
    },
    {
        id: 3,
        type: "warning",
        patientId: 3,
        patientName: "Mohamed Saeed",
        bedId: "ICU-103",
        title: "Medication Due Soon",
        message: "Furosemide 40mg IV due in 5 minutes.",
        time: "Just now",
        timestamp: Date.now()
    },
    {
        id: 4,
        type: "warning",
        patientId: 6,
        patientName: "Layla Hassan",
        bedId: "ICU-106",
        title: "Medication Due Soon",
        message: "Magnesium Sulfate 2g IV due in 3 minutes.",
        time: "Just now",
        timestamp: Date.now()
    }
];
