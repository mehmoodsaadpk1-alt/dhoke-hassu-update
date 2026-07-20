const profile = {
  gender: null,
  date_of_birth: null,
  socialLinks: {
    gender: "Male",
    dateOfBirth: "1995-01-01"
  }
};

let parsedSocialLinks = {};
if (profile.socialLinks) {
  try {
    parsedSocialLinks = typeof profile.socialLinks === 'string' 
      ? JSON.parse(profile.socialLinks) 
      : profile.socialLinks;
  } catch (e) {
    console.warn("Failed to parse socialLinks:", e);
  }
}

const gender = profile.gender || (parsedSocialLinks as any)?.gender || undefined;
const dateOfBirth = profile.date_of_birth || (parsedSocialLinks as any)?.dateOfBirth || undefined;

console.log({ gender, dateOfBirth });
