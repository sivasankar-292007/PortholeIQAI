# PotholeIQ — AI-Powered Smart Road Monitoring Platform

**SDG 11: Sustainable Cities and Communities**  
*Report a pothole. Watch it get fixed. Better Roads — Brighter Futures!*

PotholeIQ is an end-to-end civic-technology platform designed to identify road potholes using on-device computer vision, enable citizens to report damaged asphalt with GPS coordinates, automatically notify municipal road authorities, coordinate engineer repairs with before-and-after photographic verification, and track all complaints transparently on a public repair map.

---

## 🌟 Key Features

1. **AI Pothole Detection & Rejection:**
   - Preprocesses road images to $224 \times 224$ pixels (standard MobileNetV2 input layer).
   - Real-time on-device edge pipeline assessing cavity luminance depressions, fractured bitumen edge gradients, and estimated damage area.
   - **Normal Road Rejection:** Rejects normal smooth roads and prompts users to upload genuine road hazards.
   - Severity estimation: **Low** (<5% area), **Medium** (5–15%), **Dangerous** (>15% critical two-wheeler crash hazard).
   - Optional server/client Gemini Vision API integration (`gemini-3.8-flash`) for deep civil structural road audits.

2. **Public Repair Map:**
   - **Red Pin:** Pending inspection and unassigned.
   - **Amber Pin:** Assigned or actively In Progress.
   - **Green Pin:** Repaired and verified with before-and-after photographic proof.
   - Real-time interactive Leaflet map and schematic Exhibition City Grid mode.

3. **Dynamic Days-Ignored Counter:**
   - Automatically computes elapsed calendar days between citizen submission and repair completion.
   - Creates public civic accountability for delayed repairs.

4. **Role-Based Dashboards (RBAC):**
   - **Citizen:** Snap/upload photo, run AI check, set location, submit complaint, track repair timeline.
   - **Municipal Officer:** Filter by ward/severity, detect duplicate nearby complaints (<75m), assign work orders to registered engineers with deadlines and priorities, monitor overdue complaints.
   - **Engineer:** Access only assigned tasks, navigate via Google Maps directions, start work (In Progress), upload after-repair photograph, log materials used, and mark Completed.

5. **Automatic Municipal Dispatch Notifications:**
   - Simulates and logs automated email alerts to municipal road departments and assigned engineers using the Firestore `mail` collection schema.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti.
- **Mapping:** Leaflet & OpenStreetMap tiles + schematic SVG city sector grid.
- **AI Inference:** MobileNetV2 edge pipeline ($224 \times 224$ RGB input), Sobel edge gradient, cavity luminance ratio, configurable sigmoid threshold ($0.50$ default).
- **Backend & Database:** Firebase Auth (Email/Password), Cloud Firestore, Firebase Storage.
- **Mobile Packaging:** Capacitor 6 / 7 for native Android APK generation.

---

## 🚀 Quick Start Guide

### 1. Installation & Local Development

```bash
# Clone the repository and install dependencies
npm install

# Start Vite development server on port 3000
npm run dev
```

Visit `http://localhost:3000` in your browser.

### 2. Environment Variables Configuration

Copy `.env.example` to `.env`:

```bash
# Optional backend Gemini vision analysis
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# Firebase Client Configuration (Cloud Firestore, Authentication, Firebase Storage)
# Leave blank to run in resilient local demonstration mode
VITE_FIREBASE_API_KEY=""
VITE_FIREBASE_AUTH_DOMAIN=""
VITE_FIREBASE_PROJECT_ID=""
VITE_FIREBASE_STORAGE_BUCKET=""
VITE_FIREBASE_MESSAGING_SENDER_ID=""
VITE_FIREBASE_APP_ID=""

# Municipal Alert Dispatch Email
VITE_MUNICIPAL_OFFICE_EMAIL="potholes-response@smartcity.gov"
```

*Note:* If Firebase credentials are not provided, PotholeIQ automatically activates its **Offline Demonstration Mode** with preloaded test cases and local persistence.

---

## 🤖 Google Colab Model Training Workflow

To train a custom MobileNetV2 binary classifier in Google Colab:

1. **Dataset:** Collect 500+ pothole images and 500+ normal road images (e.g. from Kaggle Road Pothole Dataset).
2. **Transfer Learning Architecture:**
   ```python
   import tensorflow as tf
   from tensorflow.keras import layers, models

   base_model = tf.keras.applications.MobileNetV2(
       input_shape=(224, 224, 3),
       include_top=False,
       weights='imagenet'
   )
   base_model.trainable = False  # Freeze ImageNet weights

   model = models.Sequential([
       layers.Resizing(224, 224),
       base_model,
       layers.GlobalAveragePooling2D(),
       layers.Dropout(0.2),
       layers.Dense(1, activation='sigmoid') # Binary: 0=normal, 1=pothole
   ])

   model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
   model.fit(train_dataset, epochs=8, validation_data=val_dataset)

   # Export to TensorFlow Lite for on-device mobile inference
   converter = tf.lite.TFLiteConverter.from_keras_model(model)
   tflite_model = converter.convert()
   with open('pothole.tflite', 'wb') as f:
       f.write(tflite_model)
   ```

---

## 📱 Android Packaging via Capacitor

PotholeIQ is ready to be bundled into an Android application:

```bash
# 1. Install Capacitor dependencies
npm install @capacitor/core @capacitor/cli @capacitor/camera @capacitor/geolocation

# 2. Build production web bundle
npm run build

# 3. Add Android platform
npx cap add android

# 4. Sync web assets
npx cap sync

# 5. Open in Android Studio
npx cap open android
```

### Android Permissions in `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

---

## 🎯 College Exhibition Demonstration Sequence

For a live evaluation or SDG competition presentation, use the **"Interactive Demo"** launcher in the top navigation bar:

1. **Step 1 (Citizen):** Click **"Instant Test Presets > Severe Crater"** or upload a photo.
2. **Step 2 (Citizen):** Click **"Run AI check"**. See confidence score (92%) and Dangerous severity badge. Test "Normal Road" preset to demonstrate AI rejection.
3. **Step 3 (Citizen):** Select a location on the map and click **"Submit complaint"**.
4. **Step 4 (Public Map):** Go to Public Map. The complaint appears as a **RED PIN**.
5. **Step 5 (Officer):** Switch role to **Officer**. In the Officer Panel, click **"Assign"**, select **Eng. Rajesh Kumar**, and set a deadline.
6. **Step 6 (Engineer):** Switch role to **Engineer**. View assigned task. Click **"Start Repair"** (status turns In Progress / Amber).
7. **Step 7 (Engineer):** Click **"Upload Proof & Finish"**, submit the repaired bitumen photo and materials notes.
8. **Step 8 (Public Map):** Return to Public Map. The pin turns **GREEN**! Tap it to open the interactive **Before & After Repair Slider**.

---

## 🔒 Security & Firestore Rules

- `firestore.rules` enforces strict server-side RBAC:
  - Citizens can only create complaints with status `Pending`.
  - Only municipal officers can assign engineers and edit repair deadlines.
  - Only the assigned engineer can change status to `In Progress` and `Completed` with valid after-repair photos.
  - Public can read approved transparency fields.
- `storage.rules` restricts image uploads to image MIME types under 10MB.
