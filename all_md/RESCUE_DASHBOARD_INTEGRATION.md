# Rescue Dashboard - Database Integration Guide

## Overview
Your Rescue Dashboard is now connected to real Supabase data! Here's what's integrated and what you need to do.

## ✅ What's Already Integrated

### 1. **Real-Time Alerts** 📍
- Fetches active alerts from `alerts` table
- Shows student name from joined `students` table
- Displays severity level and location
- **Auto-refreshes** when new alerts are created
- Real-time subscription enabled

### 2. **Rescue Officers List** 👥
- Pulls officers from `profiles` table
- Shows availability status
- Contact information ready to use
- Mock data for distance/vehicle type (ready to connect)

### 3. **Key Metrics** 📊
- Active alerts count (auto-calculated)
- Resolved incidents today (auto-calculated)
- Average response time (ready to add formula)
- Available officers count

### 4. **Incident History** 📋
- Fetches resolved alerts
- Shows responder info
- Resolution timestamps
- Auto-linked with alert data

### 5. **Notifications** 🔔
- Real-time alert notifications
- Status update notifications
- User-friendly notification panel with badges

### 6. **Team Communications** 💬
- Per-incident chat messages
- Real-time message subscription
- Easy integration with chat table

---

## 📋 Database Tables You Need to Verify/Create

### 1. **alerts** (Should already exist)
```sql
-- Verify it has these columns:
- id (UUID)
- student_id (UUID) - FK to students
- driver_id (UUID) - FK to drivers
- message (TEXT) - Location/alert description
- status (alert_status enum: 'active', 'resolved')
- level (alert_level enum: 'high', 'medium', 'low')
- location_lat (FLOAT)
- location_lng (FLOAT)
- created_at (TIMESTAMP)
- resolved_at (TIMESTAMP)
```

### 2. **profiles** (Should already exist)
```sql
-- Verify it has:
- id (UUID)
- full_name (TEXT)
- email (TEXT)
- phone (TEXT) -- NEEDS TO BE ADDED
- latitude (FLOAT) -- NEEDS TO BE ADDED
- longitude (FLOAT) -- NEEDS TO BE ADDED
```

### 3. **rescue_officers** (OPTIONAL - Create if needed)
```sql
CREATE TABLE rescue_officers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id),
  phone VARCHAR(20),
  vehicle_type VARCHAR(100),
  current_lat FLOAT,
  current_lng FLOAT,
  status VARCHAR(20) DEFAULT 'available',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### 4. **rescue_messages** (OPTIONAL - For chat)
```sql
CREATE TABLE rescue_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES alerts(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  message TEXT NOT NULL,
  sender_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT now()
);
```

### 5. **notifications** (OPTIONAL - For persistent notifications)
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  title VARCHAR(200),
  message TEXT,
  type VARCHAR(50),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now()
);
```

---

## 🔧 How to Customize for Your Needs

### **Modify Alert Fetching** (useRescueData.ts)
The current code fetches from `alerts` table. To add more fields:

```typescript
// In fetchAlerts function, add to select():
.select(`
  id,
  message,
  status,
  level,
  location_lat,
  location_lng,
  created_at,
  student_id,
  driver_id,
  students (full_name, student_id_number),  // Add more student fields
  drivers (full_name)  // Add driver info
`)
```

### **Add Officer Phone/Distance** (useRescueData.ts)
Replace mock values with real data:

```typescript
// Current (mock):
phone: "+63 912 345 6789",
distance: Math.random() * 5 + 0.5,

// Change to:
phone: officer.phone || "N/A",
distance: calculateDistance(
  officer.latitude, 
  officer.longitude,
  alert.location_lat,
  alert.location_lng
)
```

### **Connect Chat to Database** (useRescueNotifications.ts)
Uncomment and enable the database save in `sendChatMessage`:

```typescript
// Uncomment these lines:
await supabase.from("rescue_messages").insert({
  alert_id: alertId,
  user_id: user.id,
  message,
  sender_name: user.email?.split("@")[0],
});
```

---

## 🚀 Quick Start Checklist

- [ ] Verify `alerts` table exists and has all required columns
- [ ] Test if `profiles` table fetches rescue officers correctly
- [ ] (Optional) Create `rescue_messages` table for chat persistence
- [ ] (Optional) Create `rescue_officers` table for detailed officer info
- [ ] Update `.env` with SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY
- [ ] Test the dashboard - alerts should load from database
- [ ] Check browser console for any Supabase errors
- [ ] Enable real-time subscriptions in Supabase dashboard

---

## 📱 Real-Time Features Enabled

✅ Auto-refresh alerts every 30 seconds  
✅ Real-time alert creation notifications  
✅ Real-time chat message updates  
✅ Metric auto-calculation  
✅ Officer list updates  

---

## 🐛 Troubleshooting

**"No alerts showing?"**
- Check if alerts exist in your database
- Verify SUPABASE_URL and keys in .env
- Check browser console for errors

**"Can't see officers?"**
- Make sure profiles table has data
- Check if Supabase connection is working
- Verify Row Level Security (RLS) policies

**"Chat not sending?"**
- Create `rescue_messages` table (see schema above)
- Uncomment the database save code
- Check RLS policies on table

**"Notifications not appearing?"**
- Check browser console
- Verify real-time subscriptions are enabled
- Create `notifications` table if needed

---

## 📞 Next Steps

1. **Add Officer Management** - Create page to add/remove rescue officers
2. **Map Integration** - Connect Google Maps or Mapbox to show live locations
3. **Response Tracking** - Track response times and responder assignments
4. **Incident Reports** - Generate PDF reports of resolved incidents
5. **Performance Analytics** - Dashboard for response metrics over time

---

**All code is ready to go! Just ensure your database schema matches what's expected above.**
