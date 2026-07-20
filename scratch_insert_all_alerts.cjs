const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const mockAlerts = [
  {
    id: 'a1',
    title: 'Severe Water Shortage - Main Valve Burst',
    category: 'Utility Issue',
    description: 'The municipal water supply valve near Sector 2 has experienced a severe pipe burst. Water supply for Street 3, 4, and 5 in Dhoke Hassu is completely suspended. Repairs are underway, but the suspension is expected to last for another 24 hours. Residents are strictly advised to conserve their stored water.',
    area: 'Dhoke Hassu Sector 2',
    postedTime: '15 mins ago',
    severity: 'Urgent',
    priority: 'Critical',
    confirmationsCount: 18,
    postedBy: 'Zahid Mehmood (Water Committee Head)',
    image: 'https://images.unsplash.com/photo-1542013936693-8848e574047a?auto=format&fit=crop&q=80&w=600',
    contact: '051-5551234',
    relatedUpdates: {
      updates: [
        'Repair team arrived at 12:30 PM and started excavating the site.',
        'Replacement valve procured from City Store. Installation begins shortly.',
        'Emergency water tanker service has been requested for affected streets.'
      ],
      status: 'Active'
    }
  },
  {
    id: 'a2',
    title: 'Suspicious Activity & Bike Theft Attempt',
    category: 'Security',
    description: 'Two unidentified individuals wearing masks on a black 125cc motorcycle were spotted roaming suspicious in Street 8 and attempting to unlock a parked motorcycle. When residents gathered, they fled towards the Main Road. Please lock your security gates and stay vigilant.',
    area: 'Street 8, Dhoke Hassu',
    postedTime: '2 hours ago',
    severity: 'Urgent',
    priority: 'High',
    confirmationsCount: 32,
    postedBy: 'Yaseen Malik (Watch Group Captain)',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=600',
    contact: '0321-4445555',
    relatedUpdates: {
      updates: [
        'Street CCTV footage has been shared with the local police post.',
        'Voluntary night patrolling teams are being organized starting tonight at 11:00 PM.'
      ],
      status: 'Active'
    }
  },
  {
    id: 'a3',
    title: 'Missing Child Alert: 7-Year-Old Ahmed',
    category: 'Missing Person',
    description: 'Ahmed, a 7-year-old boy, wearing a blue Kurta Shalwar, went missing from the playground near Jamia Masjid Ghausia today at 4:30 PM. He has brown hair, is about 3.8 feet tall, and speaks both Urdu and Punjabi. If you have any information, please contact immediately!',
    area: 'Jamia Masjid Ghausia, Dhoke Hassu',
    postedTime: '3 hours ago',
    severity: 'Urgent',
    priority: 'Critical',
    confirmationsCount: 54,
    postedBy: 'Sajid Mehmood (Father)',
    image: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&q=80&w=600',
    contact: '0333-5559988',
    relatedUpdates: {
      updates: [
        'Local mosque made general announcements to find Ahmed.',
        'Search parties are currently scanning the Main Park and surrounding residential streets.'
      ],
      status: 'Active'
    }
  },
  {
    id: 'a4',
    title: 'Main Bazar Road Construction - Traffic Blockage',
    category: 'Traffic',
    description: 'Sewerage excavation and road carpeting have commenced near the Chungi No. 22 entry point. The road is completely blocked for cars, rickshaws, and auto-loaders. Only motorcycles can squeeze through. Please use Gali No. 12 as an alternate route.',
    area: 'Main Bazar Road, Dhoke Hassu',
    postedTime: '5 hours ago',
    severity: 'Medium',
    priority: 'Normal',
    confirmationsCount: 11,
    postedBy: 'Kamran Mughal (Contractor)',
    image: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600',
    contact: '0300-5556677',
    relatedUpdates: {
      updates: [
        'Excavation complete. Sewerage pipe placement is 50% done.',
        'Traffic warden deployed at Chungi No. 22 intersection to guide commuters.'
      ],
      status: 'Active'
    }
  },
  {
    id: 'a5',
    title: 'Heavy Rainfall Warning - Low Lying Area Flooding Risk',
    category: 'Weather',
    description: 'Met Department has issued a heavy monsoon rain warning for Rawalpindi. Low-lying areas in Dhoke Hassu near the Nullah Lai drainage flow are at risk of minor urban flooding. Residents are advised to clear street drain inlets and secure ground-floor electrical items.',
    area: 'Dhoke Hassu (Low-lying areas)',
    postedTime: '6 hours ago',
    severity: 'Medium',
    priority: 'High',
    confirmationsCount: 22,
    postedBy: 'Rawal Relief Unit',
    image: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&q=80&w=600',
    contact: '1122',
    relatedUpdates: {
      updates: [
        'Nullah Lai water level monitored; currently at normal baseline level.',
        'Municipal clean-up crew has finished clearing trash from main drain choke points.'
      ],
      status: 'Active'
    }
  },
  {
    id: 'a6',
    title: 'Free Blood Sugar & BP Camp at Welfare Clinic',
    category: 'Community Notice',
    description: 'A free general health medical checkup camp is being held this Sunday, July 5th, from 9 AM to 1 PM at the Dhoke Hassu Welfare Clinic. Qualified doctors will provide free consultations, free BP checkup, blood sugar testing, and basic medicine distribution.',
    area: 'Street 9 Welfare Clinic, Dhoke Hassu',
    postedTime: '1 day ago',
    severity: 'Information',
    priority: 'Normal',
    confirmationsCount: 45,
    postedBy: 'Raja Tanveer (Welfare Chairman)',
    image: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?auto=format&fit=crop&q=80&w=600',
    contact: '0345-6667788',
    relatedUpdates: {
      updates: [
        'Free medicine supplies sponsored by Hamdard Pharmacy arrived today.',
        '3 local volunteer doctors confirmed their participation.'
      ],
      status: 'Active'
    }
  }
];

async function insertAll() {
  console.log("Inserting all mock alerts...");
  for (const alert of mockAlerts) {
    const { error } = await supabase
      .from('alerts')
      .upsert(alert, { onConflict: 'id' });
    if (error) {
      console.error(`Error inserting ${alert.id}:`, error.message);
    } else {
      console.log(`Inserted ${alert.id} successfully.`);
    }
  }
}

insertAll();
