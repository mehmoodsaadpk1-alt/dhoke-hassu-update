/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Helper to check if a specific name or business is verified in Dhoke Hassu Connect
export function isEntityVerified(name: string): boolean {
  if (!name) return false;
  try {
    // Check local storage for list of custom verified names
    const saved = localStorage.getItem('dhoke_connect_verified_names');
    const verifiedNames: string[] = saved ? JSON.parse(saved) : [
      'Zia-ur-Rehman (Union Council President)',
      'Bashir Ahmed',
      'Chaudhary Kamran',
      'Ayesha Siddiqui',
      'Siddique Sweets'
    ];

    // Check if the current user profile is verified
    const userProfileSaved = localStorage.getItem('dh_user_profile_data');
    if (userProfileSaved) {
      const profile = JSON.parse(userProfileSaved);
      if (profile.fullName && profile.fullName.toLowerCase() === name.toLowerCase()) {
        return !!profile.verified;
      }
    }

    return verifiedNames.some(n => n.toLowerCase() === name.toLowerCase());
  } catch {
    return [
      'Zia-ur-Rehman (Union Council President)',
      'Bashir Ahmed',
      'Chaudhary Kamran',
      'Ayesha Siddiqui',
      'Siddique Sweets'
    ].some(n => n.toLowerCase() === name.toLowerCase());
  }
}

// Add a name to the list of verified entities
export function addVerifiedEntity(name: string): void {
  if (!name) return;
  try {
    const saved = localStorage.getItem('dhoke_connect_verified_names');
    const verifiedNames: string[] = saved ? JSON.parse(saved) : [
      'Zia-ur-Rehman (Union Council President)',
      'Bashir Ahmed',
      'Chaudhary Kamran',
      'Ayesha Siddiqui',
      'Siddique Sweets'
    ];

    if (!verifiedNames.some(n => n.toLowerCase() === name.toLowerCase())) {
      verifiedNames.push(name);
      localStorage.setItem('dhoke_connect_verified_names', JSON.stringify(verifiedNames));
    }
  } catch (err) {
    console.warn('Status adding verified entity:', err);
  }
}

// Remove a name from the list of verified entities
export function removeVerifiedEntity(name: string): void {
  if (!name) return;
  try {
    const saved = localStorage.getItem('dhoke_connect_verified_names');
    const verifiedNames: string[] = saved ? JSON.parse(saved) : [
      'Zia-ur-Rehman (Union Council President)',
      'Bashir Ahmed',
      'Chaudhary Kamran',
      'Ayesha Siddiqui',
      'Siddique Sweets'
    ];

    const updated = verifiedNames.filter(n => n.toLowerCase() !== name.toLowerCase());
    localStorage.setItem('dhoke_connect_verified_names', JSON.stringify(updated));
  } catch (err) {
    console.warn('Status removing verified entity:', err);
  }
}
