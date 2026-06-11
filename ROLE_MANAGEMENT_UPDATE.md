# User Role Management System Update

## Overview
Modified the user role management system to enforce that when editing a user, the role dropdown only shows roles different from the user's current role.

## Changes Made

### 1. Frontend Changes - AdminDashboard.jsx

#### Added Helper Function
```javascript
// Get available roles based on current role (exclude current role from dropdown)
const getAvailableRoles = (currentRole) => {
  const allRoles = ['student', 'teacher', 'admin'];
  return allRoles.filter(role => role !== currentRole);
};
```

#### Edit User Modal - Role Dropdown
- **Location**: Edit User Modal in AdminDashboard.jsx
- **Changes**:
  - Added display of current user role in a read-only box
  - Role dropdown now shows only roles different from the current role
  - User cannot select their current role
  - Added helpful text: "Select a role different from the current role"
  - Improved styling with visual feedback

**Before:**
```jsx
<select 
  value={userForm.role}
  onChange={(e) => setUserForm({...userForm, role: e.target.value})}
  required
>
  <option value="student">Student</option>
  <option value="teacher">Teacher</option>
  <option value="admin">Admin</option>
</select>
```

**After:**
```jsx
<div>
  <label className="block text-sm font-semibold text-gray-700 mb-2">User Role</label>
  <div className="bg-gray-50 rounded-lg p-2 mb-2 border border-gray-200">
    <p className="text-sm text-gray-600">Current Role: <span className="font-semibold text-primary-900">{editingUser?.role ? editingUser.role.charAt(0).toUpperCase() + editingUser.role.slice(1) : 'N/A'}</span></p>
  </div>
  <select 
    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    value={userForm.role}
    onChange={(e) => setUserForm({...userForm, role: e.target.value})}
    required
  >
    <option value="">-- Select New Role --</option>
    {editingUser && getAvailableRoles(editingUser.role).map(role => (
      <option key={role} value={role}>
        {role === 'student' ? '🎓 ' : role === 'teacher' ? '👨‍🏫 ' : '🔐 '}
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </option>
    ))}
  </select>
  <p className="text-xs text-gray-500 mt-1">Select a role different from the current role</p>
</div>
```

#### Add User Modal - No Changes
- When adding a new user, all three roles remain available (no current role to exclude)
- Added note: "Note: All roles are available when adding a new user."

---

### 2. Backend Changes - userController.js

#### updateUser Function - Added Validation
- **Location**: `/backend/controllers/userController.js`, `updateUser` function
- **Changes**:
  - Added validation to prevent changing a user's role to their current role
  - Checks current user's role before applying the update
  - Works with both JSON DB and MongoDB
  - Returns a clear error message if user attempts same-role change

**New Validation Code:**
```javascript
// Validate role change: prevent changing to the same role
if (updateData.role) {
  let currentUser;
  if (isJsonDB()) {
    currentUser = global.jsonDB.users.find(u => u._id === userId);
  } else {
    currentUser = await User.findById(userId).select('role');
  }
  
  if (currentUser && updateData.role === currentUser.role) {
    return res.status(400).json({ 
      success: false, 
      message: `User is already a ${currentUser.role}. Please select a different role.` 
    });
  }
}
```

**Validation Behavior:**
- Admin can change any user's role to one of the other two roles
- Non-admin users cannot change their own role (already restricted)
- API returns `400 Bad Request` if attempt to set same role
- Error message clearly indicates the user's current role

---

### 3. Database - User Model (Verified)

#### Role Field - Already Correctly Configured
```javascript
role: {
  type: String,
  enum: ['student', 'teacher', 'admin'],
  required: [true, 'Role is required'],
  default: 'student'
}
```

**Confirmation:**
- ✅ Stores single role (String type, not Array)
- ✅ Only allows enum values: ['student', 'teacher', 'admin']
- ✅ Role is required - every user must have a role
- ✅ Database enforces single-role constraint at schema level

---

## Behavior Summary

### When Editing a User with Role "Admin"
- ✅ Current Role displayed: "Admin"
- ✅ Available options in dropdown: "Student", "Teacher"
- ❌ "Admin" NOT in dropdown

### When Editing a User with Role "Teacher"
- ✅ Current Role displayed: "Teacher"
- ✅ Available options in dropdown: "Admin", "Student"
- ❌ "Teacher" NOT in dropdown

### When Editing a User with Role "Student"
- ✅ Current Role displayed: "Student"
- ✅ Available options in dropdown: "Admin", "Teacher"
- ❌ "Student" NOT in dropdown

### When Adding a New User
- ✅ All three roles available: "Admin", "Teacher", "Student"
- ✅ Note displayed: "All roles are available when adding a new user"

---

## Validation & Enforcement

### Frontend Validation ✅
- Role dropdown automatically excludes current role
- User cannot select current role from UI
- Clear visual indication of current role

### Backend Validation ✅
- Server validates role change even if frontend bypassed
- Returns `400 Bad Request` with clear error message
- Works with both MongoDB and JSON database
- Prevents API-level role manipulation

### Database Validation ✅
- Schema enforces single-role constraint
- Enum validation ensures only valid roles stored
- Role always required (never null/undefined)

---

## Testing Checklist

- [ ] Edit admin user: verify dropdown shows only "Teacher" and "Student"
- [ ] Edit teacher user: verify dropdown shows only "Admin" and "Student"
- [ ] Edit student user: verify dropdown shows only "Admin" and "Teacher"
- [ ] Try to change user to same role: verify error message from backend
- [ ] Add new user: verify all three roles available
- [ ] Test with both MongoDB and JSON database backends
- [ ] Test that password cannot be changed via edit modal
- [ ] Verify role display box shows current role correctly

---

## Files Modified

1. **Frontend**:
   - `src/pages/dashboard/AdminDashboard.jsx` (2 sections modified)
     - Added `getAvailableRoles()` helper function
     - Updated Edit User Modal role dropdown

2. **Backend**:
   - `backend/controllers/userController.js` (1 function modified)
     - Added role validation in `updateUser()` function

---

## Rollback Instructions (if needed)

### Frontend Changes:
1. Remove `getAvailableRoles()` function
2. Revert Edit User Modal back to hardcoded 3 options

### Backend Changes:
1. Remove the role validation check in `updateUser()` function
2. Keep the rest of the function as-is

---

## Future Enhancements

- [ ] Add audit logging for role changes
- [ ] Email notification when user role is changed
- [ ] Admin dashboard showing role change history
- [ ] Restrict certain role changes (e.g., don't allow demoting last admin)
- [ ] Add role change approval workflow
