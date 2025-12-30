// Script to check current user from JWT token
const token = localStorage.getItem('authToken');

console.log('=== JWT TOKEN DEBUG ===');
console.log('Token exists:', !!token);

if (token) {
  try {
    // Decode JWT payload
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('Decoded payload:', payload);
    console.log('User ID:', payload.user_id);
    console.log('Role:', payload.role);
    console.log('Email (if any):', payload.email);

    // Check if this is Vingroup recruiter
    const vingroupRecruiterId = 'a33f0377-8fd8-4225-9b2f-0587c8dfc970';
    const isVingroupRecruiter = payload.user_id === vingroupRecruiterId;

    console.log('Is Vingroup recruiter?', isVingroupRecruiter);
    console.log('Expected recruiter ID:', vingroupRecruiterId);
    console.log('Actual user ID:', payload.user_id);

    if (isVingroupRecruiter) {
      console.log('✅ User is the correct Vingroup recruiter');
    } else {
      console.log('❌ User is NOT the Vingroup recruiter');
      console.log('This explains the 403 error - wrong recruiter accessing job');
    }

  } catch (error) {
    console.error('Error decoding JWT:', error);
  }
} else {
  console.log('❌ No auth token found');
}

console.log('=== END DEBUG ===');
