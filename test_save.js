const { dbSaveUserProfile } = require('./src/utils/supabaseClient');

async function test() {
  const dummy = {
    id: 'test-user-id',
    fullName: 'Test User',
    email: 'test@example.com',
    profilePhoto: null,
    mobileNumber: null,
    username: 'testuser',
    bio: 'Testing',
    area: 'Dhoke Hassu',
    coverPhoto: null,
    contactNumber: null,
    socialLinks: { gender: 'Male', dateOfBirth: '2000-01-01' },
    badges: [],
    reputationScore: 100,
    verified: true,
    joinDate: undefined,
    gender: undefined,
    dateOfBirth: undefined,
    provinceId: undefined,
    cityId: undefined,
    areaId: undefined,
    latitude: undefined,
    longitude: undefined,
  };
  const result = await dbSaveUserProfile(dummy);
  console.log('Save result:', result);
}

test();
