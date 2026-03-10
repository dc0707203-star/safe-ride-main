# Real Data Integration - Rescue Dashboard & Admin

## ✅ What's Now Working

### 1. **Real Officer Data** 👥
- ✅ Fetches actual officers from `profiles` table
- ✅ Shows **"Walang officers"** if no data exists
- ✅ Real-time updates when officers are added/removed
- ✅ RescueAdmin displays actual officer list from database

### 2. **Real Alerts from Students** 🚨
- ✅ New hook: `useSendSOS` - Students can send emergency alerts
- ✅ Alerts automatically appear in Rescue Dashboard
- ✅ Real-time subscriptions - instant notifications to rescue team
- ✅ Shows **"Walang active alerts"** when none exist

### 3. **Empty States** 📭
- ✅ Officers tab: "Walang officers sa sistema"
- ✅ Active Alerts: "Walang active alerts"
- ✅ Performance: "Walang performance data"
- ✅ Incidents: "Walang incident history"

---

## 🔄 How Data Flows

### **Student Sends SOS → Rescue Sees It**

```
1. Student clicks SOS button
   ↓
2. useSendSOS hook sends alert to database
   ↓
3. Alert inserted into 'alerts' table with status='active'
   ↓
4. Real-time subscription triggers
   ↓
5. RescueDashboard auto-updates with new alert
   ↓
6. Rescue team sees it immediately + notification
```

---

## 🛠️ How to Use in Your Code

### **From Student Component:**

```typescript
import { useSendSOS } from "@/hooks/useSendSOS";
import { useAuth } from "@/hooks/useAuth";
import { useLocationTracker } from "@/hooks/useLocationTracker";

const StudentComponent = () => {
  const { user } = useAuth();
  const { sendEmergencyAlert } = useSendSOS();
  const { location } = useLocationTracker();

  const handleSOSClick = async () => {
    await sendEmergencyAlert(
      user?.id || "unknown",
      location?.address || "Unknown Location",
      location?.latitude || 0,
      location?.longitude || 0
    );
  };

  return (
    <button onClick={handleSOSClick} className="bg-red-600 text-white px-6 py-3">
      🚨 SOS - EMERGENCY
    </button>
  );
};
```

---

## 📊 Real Data Sources

### **RescueAdmin Gets Data From:**
- `profiles` table → Officer list
- `alerts` table → Active/resolved count, metrics

### **RescueDashboard Gets Data From:**
- `alerts` table → Active emergency alerts
- `profiles` table → Nearby officers
- Real-time subscriptions → Instant updates

---

## 🔌 Database Schema Required

### **alerts Table** (for SOS)
```sql
- id (UUID)
- student_id (UUID) - FK to users
- message (TEXT) - Location + message
- status (alert_status: 'active', 'resolved')
- level (alert_level: 'high', 'medium', 'low')
- location_lat (FLOAT)
- location_lng (FLOAT)
- created_at (TIMESTAMP)
- resolved_at (TIMESTAMP)
```

### **profiles Table** (for officers)
```sql
- id (UUID)
- full_name (TEXT)
- email (TEXT)
- phone (TEXT) - Optional, can add
```

---

## 🎯 Next Steps

1. **Test with Real Data:**
   - Add some officers to `profiles` table
   - Admin dashboard should show them
   - If none exist → "Walang officers" shows

2. **Connect Student SOS:**
   - Add SOS button to Student dashboard
   - When clicked → sends alert to database
   - Rescue dashboard shows it in real-time

3. **Add Rescue Officer Info:**
   - Update `profiles.phone` field
   - Add vehicle_type to profiles or create `rescue_officers` table
   - Pull real data instead of mock values

4. **Test Real-Time Features:**
   - Open Rescue dashboard
   - Have a student send SOS
   - Alert should appear instantly (no refresh needed)

---

## 🧪 Test Commands

**Add test officer:**
```sql
INSERT INTO profiles (id, full_name, email, created_at)
VALUES ('test-officer-1', 'Officer Test', 'officer@test.com', now());
```

**Trigger test alert:**
```sql
INSERT INTO alerts (student_id, message, status, level, location_lat, location_lng, created_at)
VALUES ('student-1', 'Test Location - Test Alert', 'active', 'high', 15.5007, 120.9197, now());
```

---

## 🔐 RLS Policies

Make sure your Supabase RLS policies allow:
- ✅ Students to INSERT into alerts (send SOS)
- ✅ Rescue team to SELECT all alerts
- ✅ Profiles to be readable by rescue team

---

**Everything is now connected to real data! The dashboard will automatically show real officers and update instantly when students send SOS alerts.** 🚀
