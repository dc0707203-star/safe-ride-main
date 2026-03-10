# Tricycle Grab Feature - Integration Guide

## Overview
The Tricycle Grab feature allows students to request rides from drivers when no tricycle is available on campus. Drivers can see these requests in real-time and accept/decline them.

## What Has Been Implemented

### 1. **Database Migration** ✅
- **File:** `supabase/migrations/20260214_create_ride_requests.sql`
- Creates `ride_requests` table with:
  - Student and driver relationships
  - Status tracking (pending, accepted, rejected, cancelled, completed)
  - Location coordinates (pickup and dropoff)
  - Timestamps for lifecycle tracking
  - Real-time subscription support

### 2. **Student Portal Component** ✅
- **File:** `src/components/RideRequestDialog.tsx`
- Modal dialog for students to request a ride
- Features:
  - Pickup location input
  - Optional message/notes
  - Automatic geolocation capture
  - Shows available drivers count
  - Real-time updates

### 3. **Student Portal Integration** ✅
- **File:** `src/pages/Student.tsx`
- Added "Request Tricycle" button to Quick Actions
- Integrated RideRequestDialog component
- Purple-themed button matching other actions

### 4. **Driver-Side Hook** ✅
- **File:** `src/hooks/useRideRequests.ts`
- Real-time subscription to ride requests
- Methods:
  - `acceptRequest()` - Accept a ride request
  - `rejectRequest()` - Decline with optional reason
  - `completeRide()` - Mark ride as completed
- Automatic state management with Supabase real-time

### 5. **Driver Notifications Panel** ✅
- **File:** `src/components/RideRequestsPanel.tsx`
- Two-part interface:
  - **Pending Requests:** All available requests from students
  - **Active Rides:** Rides accepted by current driver
- Features:
  - Student profile with photo
  - Pickup location and message
  - Quick contact buttons
  - Accept/Decline/Complete actions
  - Formatted timestamps

### 6. **Driver Dashboard Integration** ✅
- **File:** `src/pages/DriverDashboard.tsx`
- Added RideRequestsPanel to driver dashboard
- Section positioned prominently after active trip info
- Real-time updates for all drivers

## How It Works

### Student Flow
1. Student opens app and goes to home page
2. Clicks **"Request Tricycle"** button
3. Dialog opens showing available drivers
4. Enters pickup location and optional message
5. Submits request
6. Request is sent to all available drivers
7. Students receives notification when driver accepts

### Driver Flow
1. Driver logs in to dashboard
2. **Tricycle Grab Requests** section shows:
   - **Pending:** All requests not yet accepted
   - **Active:** Rides they've accepted
3. Driver can:
   - **Accept** - Claim the ride and navigate to student
   - **Decline** - Reject request (goes to another driver)
   - **Complete** - Mark ride as finished
4. Driver sees student info, contact, and pickup location

## Database Features

### Row-Level Security (RLS) Policies
- ✅ Students can only see/create their own requests
- ✅ Drivers can see all pending requests
- ✅ Drivers can only manage their accepted requests
- ✅ Admins have full visibility
- ✅ Automatic data isolation by student/driver

### Real-Time Updates
- Requests appear instantly for drivers
- Status changes broadcast to all parties
- No page refresh needed
- Subscription-based architecture

## Status Workflow

```
PENDING → ACCEPTED → COMPLETED
  ↓
REJECTED (goes back to PENDING for other drivers)

PENDING → CANCELLED (student cancels)
```

## Key Metrics Tracked

| Field | Purpose |
|-------|---------|
| `student_id` | Links to requesting student |
| `driver_id` | Links to assigned driver (after acceptance) |
| `status` | Current state of request |
| `pickup_location` | Text description from student |
| `pickup_lat/lng` | GPS coordinates |
| `message` | Student's additional notes |
| `created_at` | Request time |
| `accepted_at` | When driver accepted |
| `completed_at` | When ride completed |

## UI Components Used

- **shadcn/ui:** Button, Card, Badge, Dialog, AlertDialog
- **Lucide Icons:** MapPin, Phone, Car, Clock, CheckCircle, X, AlertCircle, User
- **Date Formatting:** date-fns (formatDistanceToNow)
- **Notifications:** Sonner (toast)

## Next Steps (Optional Enhancements)

1. **Rating System** - Students rate drivers after completion
2. **Driver Preferences** - Choose not to accept certain routes
3. **Estimated Time** - Show pickup ETA to student
4. **Payment Integration** - Charge for grab rides
5. **Chat System** - Direct messaging between student/driver
6. **Analytics** - Track request patterns and driver performance
7. **Auto-Matching** - Automatically assign nearest available driver
8. **Notifications** - Push notifications when request posted/accepted

## Testing the Feature

### To Test as Student:
1. Open Student Portal
2. Click "Request Tricycle" button
3. Enter location (e.g., "Main Gate")
4. Add optional message
5. Click "Send Request"
6. Should see success toast with driver count

### To Test as Driver:
1. Open Driver Dashboard
2. Should see "Tricycle Grab Requests" section
3. Under "Pending," should see student requests
4. Click "Accept" or "Decline"
5. Accepted rides appear under "Active Rides"
6. Click "Complete Ride" to finish

## API Endpoints (via Supabase)

All operations are through Supabase client:
- `supabase.from('ride_requests').select()` - Fetch requests
- `supabase.from('ride_requests').insert()` - Create request
- `supabase.from('ride_requests').update()` - Update status/driver
- Real-time: `supabase.channel().on('postgres_changes')` - Listen for updates

## Error Handling

- Location fetch failures: Continues without GPS data
- Database errors: Toast notifications to user
- Status conflicts: Handled by RLS policies
- Network issues: Queued for retry (with offline support)

## Security Considerations

✅ **Implemented:**
- Row-Level Security prevents data leaks
- Students can only create for themselves
- Drivers can only manage their own rides
- Admin role has full access
- Location data shared only with assigned driver

🔒 **Recommended:**
- Add rate limiting for request creation
- Implement abuse detection
- Require student verification
- Add cancellation penalties for drivers

## Files Modified/Created

```
✅ NEW FILES:
  src/components/RideRequestDialog.tsx
  src/components/RideRequestsPanel.tsx
  src/hooks/useRideRequests.ts
  supabase/migrations/20260214_create_ride_requests.sql

✅ MODIFIED FILES:
  src/pages/Student.tsx (added button & imports)
  src/pages/DriverDashboard.tsx (added panel & imports)
```

## Troubleshooting

### Requests not showing for drivers?
- Ensure driver is logged in and has correct user_id
- Check RLS policies are applied to `ride_requests` table
- Verify driver has 'driver' role in `user_roles`

### Can't submit request as student?
- Check student_id is set correctly
- Verify location permission granted if using GPS
- Check network connection

### Real-time updates not working?
- Verify Supabase real-time is enabled
- Check browser console for subscription errors
- Ensure public schema is accessible

## Production Checklist

- [ ] Test with multiple drivers and students simultaneously
- [ ] Verify push notifications work for new requests
- [ ] Load test: Can handle 100+ concurrent requests?
- [ ] Mobile responsiveness on all screen sizes
- [ ] Offline mode handling for edge cases
- [ ] Add analytics tracking
- [ ] Document driver SLAs (response time)
- [ ] Create admin panel for dispute resolution
- [ ] Set up email confirmations
- [ ] Test cancellation flows

---

**Last Updated:** February 14, 2026
**Implemented By:** GitHub Copilot
**Status:** ✅ Ready for Testing
