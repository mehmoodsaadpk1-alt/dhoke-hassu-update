import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const payload = {
      user_id: "00000000-0000-0000-0000-000000000000",
      full_name: "Test Update",
      email: "test@example.com",
      profile_photo: "test_photo_url",
      mobileNumber: "1234567890",
      username: "testuser",
      bio: "Test bio",
      joinDate: new Date().toISOString(),
      reputationScore: 100,
      verified: false,
      coverPhoto: "test_cover_url",
      contactNumber: "1234567890",
      socialLinks: {
        gender: "Male",
        dateOfBirth: "2000-01-01",
        countryId: "PK",
        provinceId: "PB",
        cityId: "RWP",
        areaId: "DH",
        latitude: 33.6,
        longitude: 73.0
      },
      badges: []
  };

  const { data, error } = await supabase.from('profiles').upsert(payload, { onConflict: 'user_id' });
  if (error) console.error("UPSERT ERROR:", error);
  else console.log("UPSERT SUCCESS!");
}

check();
