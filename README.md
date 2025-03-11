## Team Details 👥
- **Team Name**: Code4Shiksha
- **Project Title**: Parent Sync
- **Theme 4**:  Increasing Parental Engagement
- **PPT**: https://drive.google.com/file/d/1pVCAduBw2G88Kpa3qFZY_BmSdxTNhzSX/view?usp=sharing
- **App Demo**: https://www.youtube.com/watch?v=Xg7MFRtlcuU
- **Android APK File**: https://drive.google.com/file/d/1WRvjsaBRYiMzTMg4WyWZg4-MJZiQeCUX/view?usp=sharing

<img src="https://github.com/user-attachments/assets/ab070c46-07e5-4a26-a3e5-1573e94b7a9a" style="width: 100%; height: auto;">


## Tech Stack 💻

### Frontend

- React Native (Expo)

### Backend

- Node.js
- Express.js
- MongoDB

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd Frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the frontend directory and add the following:

   ```env
   EXPO_PUBLIC_GOOGLE_GEMINI_API_KEY=
   EXPO_PUBLIC_MY_API_URL=
   ```

   NOTE: To get EXPO_PUBLIC_MY_API_URL:

   1. Open Command Prompt (CMD) and type `ipconfig`, then press Enter.
   2. Look for the "IPv4 Address" under either "Wireless LAN adapter Wi-Fi" or "Ethernet adapter."
   3. Copy the IP address (e.g., `192.168.1.100`) and add the port number (e.g., `http://192.168.1.100:3000`).
   4. Paste this URL into the `.env` file for `EXPO_PUBLIC_MY_API_URL`.


4. Start the development server:

   ```bash
   npm run dev
   ```

5. Install Expo Go App on your mobile and scan the QR code to run the application, make sure both PC and mobile connected to same WiFi.

---

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd Backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```
3. Run
    ```bash
   npm run dev
   ```
3. Create a `.env` file in the backend directory and add the following:
   ```env
   PORT=
   JWT_SECRET=
   MONGODB_URI=
   ```
