/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Story, Post, JobItem, PropertyItem, BuySellItem, BusinessItem, EventItem, DealItem, AlertItem, GroupItem } from './types';

export const mockStories: Story[] = [
  {
    id: 's1',
    author: 'Aslam Khan',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600',
    time: '2h ago',
    viewed: false
  },
  {
    id: 's2',
    author: 'Zainab Bibi',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600',
    time: '5h ago',
    viewed: false
  },
  {
    id: 's3',
    author: 'Hamza Mobile',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=600',
    time: '8h ago',
    viewed: true
  },
  {
    id: 's4',
    author: 'Siddique Sweets',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600',
    time: '12h ago',
    viewed: true
  }
];

export const mockPosts: Post[] = [
  {
    id: 'p1',
    author: 'Chaudhary Kamran',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120',
    time: '3 hours ago',
    area: 'Dhoke Hassu',
    content: 'Water supply issue update: The municipal committee water tubewell near Ghausia Mosque has been repaired. Supply will resume tomorrow morning between 6:00 AM and 8:00 AM. Please store water carefully.',
    likes: 24,
    commentsCount: 8,
    liked: false
  },
  {
    id: 'p2',
    author: 'Ayesha Siddiqui',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120',
    time: '1 day ago',
    area: 'Satellite Town',
    content: 'Free Medical Camp organized by Al-Khidmat Foundation at Satellite Town Degree College ground this Sunday from 9 AM to 4 PM. Specialist doctors of general medicine, pediatrics, and cardiology will be present. Free basic medicines will be distributed.',
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800',
    likes: 42,
    commentsCount: 15,
    liked: true
  },
  {
    id: 'p3',
    author: 'Waseem Akram',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=120',
    time: '2 days ago',
    area: 'Dhoke Khabba',
    content: 'Lost wallet near Dhoke Khabba main bazaar containing my CNIC and driving license. Name on CNIC is Waseem Akram. If anyone finds it, please let me know. JazakAllah!',
    likes: 18,
    commentsCount: 3,
    liked: false
  }
];

export const mockJobs: JobItem[] = [
  {
    id: 'j1',
    title: 'Experienced Tailor Master',
    company: 'Rawal Boutique & Stitching Center',
    salary: 'PKR 35,000 - 45,000 / month',
    type: 'Full Time',
    postedBy: 'Malik Shakeel',
    contact: '0321-5551234',
    area: 'Dhoke Hassu',
    postedTime: '2 hours ago',
    description: 'Looking for a highly skilled tailor master specialized in ladies lawn suits, designer wear, and traditional embroidery stitching. Must have at least 5 years of experience in Rawalpindi area. Fabric cutting expertise is required.',
    category: 'Full Time',
    requirements: '5+ years experience, expert in cutting & sewing ladies wear, punctual and reliable.',
    deadline: '2026-08-15'
  },
  {
    id: 'j2',
    title: 'Delivery Rider for Local Grocery Store',
    company: 'Dastak Express Delivery',
    salary: 'PKR 25,000 / month',
    type: 'Part Time',
    postedBy: 'Hassan Shah',
    contact: '0333-8884321',
    area: 'Dhoke Hassu',
    postedTime: '5 hours ago',
    description: 'Required energetic delivery rider with own motorcycle and active driving license. Will be responsible for delivering daily grocery packages to houses in Dhoke Hassu, Dhoke Khabba, and Hazara Colony.',
    category: 'Part Time',
    requirements: 'Own motorcycle, valid driving license, smartphone, good route knowledge of Dhoke Hassu.',
    deadline: '2026-07-31'
  },
  {
    id: 'j3',
    title: 'Security Guard for Plaza',
    company: 'Falcon Security Services',
    salary: 'PKR 22,000 / month',
    type: 'Full Time',
    postedBy: 'Major (R) Amjad',
    contact: '0312-4448765',
    area: 'Satellite Town',
    postedTime: '1 day ago',
    description: 'Security guard needed for a commercial plaza. Duties include monitoring visitors, checking entrance gates, and night security patrolling. Ex-army personnel or certified security guard preferred.',
    category: 'Full Time',
    requirements: 'Ex-military or certified guard, height 5\'8"+, good health and eyesight.',
    deadline: '2026-08-10'
  },
  {
    id: 'j4',
    title: 'Cook for Family Home',
    company: 'Al-Iman Residency',
    salary: 'PKR 28,000 / month',
    type: 'Full Time',
    postedBy: 'Dr. Tariq Mahmood',
    contact: '0300-9876543',
    area: 'Dhoke Hassu',
    postedTime: '2 days ago',
    description: 'We require a reliable domestic cook who can prepare traditional Pakistani dishes (Biryani, Karahi, Dal, Roti) and maintain cleanliness in the kitchen. Must be hygienic and trustworthy.',
    category: 'Full Time',
    requirements: 'Excellent cooking skills (Pakistani cuisine), hygienic, polite behavior, clean record.',
    deadline: '2026-07-25'
  },
  {
    id: 'j5',
    title: 'Office Assistant / Data Entry Operator',
    company: 'Hassu Tech Solutions',
    salary: 'PKR 30,000 / month',
    type: 'Full Time',
    postedBy: 'Ahmad Ali',
    contact: '0301-5559876',
    area: 'Dhoke Hassu',
    postedTime: '3 days ago',
    description: 'Looking for a computer-literate assistant to handle simple excel data entry, printing bills, and assisting with customer queries at the desk. Basic English and Urdu typing skills are required.',
    category: 'Full Time',
    requirements: 'Matric/FA, basic computer knowledge (Word, Excel), Urdu/English typing speed of 25+ WPM.',
    deadline: '2026-08-20'
  },
  {
    id: 'j6',
    title: 'Construction Site Labourer',
    company: 'Chaudhary Builders',
    salary: 'PKR 1,200 / day',
    type: 'Daily Wage',
    postedBy: 'Chaudhary Kamran',
    contact: '0345-5551122',
    area: 'Dhoke Khabba',
    postedTime: '4 days ago',
    description: 'Urgent requirement for daily-wage labourers for an ongoing construction plaza near Dhoke Khabba main road. Work involves loading/unloading materials, mixing cement, and general site assistance.',
    category: 'Daily Wage',
    requirements: 'Hardworking, physically fit, punctuality, experience in construction labor preferred.',
    deadline: '2026-07-20'
  }
];

export const mockProperties: PropertyItem[] = [
  {
    id: 'pr1',
    title: 'Commercial Corner Shop on Main Bazar',
    price: 'PKR 18,000 / month',
    type: 'Shop',
    purpose: 'Rent',
    location: 'Dhoke Hassu Main Road',
    contact: '0345-1234567',
    area: '2.5 Marla',
    rooms: '1 Hall',
    floor: 'Ground Floor',
    description: 'Perfect corner shop with high foot traffic. Ideal for Kiryana, mobile shop, or boutique. Tiled flooring, security shutters, and electric meter pre-installed.',
    images: [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&q=80&w=600'
    ],
    ownerName: 'Chaudhary Kamran',
    featured: true
  },
  {
    id: 'pr2',
    title: '2 Bedroom Ground Floor Family House',
    price: 'PKR 25,000 / month',
    type: 'House',
    purpose: 'Rent',
    location: 'Dhoke Khabba, Near Chungi No. 22',
    contact: '0331-5432109',
    area: '4 Marla',
    rooms: '2 Bedrooms, 1 Lounge',
    floor: 'Ground Floor',
    description: 'Spacious family home with active water supply and gas connection. Separate entrance, car porch, 2 attached baths, and compact kitchen. Walking distance to local market and school.',
    images: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=600'
    ],
    ownerName: 'Malik Shakeel',
    featured: true
  },
  {
    id: 'pr3',
    title: '5 Marla Single Story Brand New House',
    price: 'PKR 1.2 Crore',
    type: 'House',
    purpose: 'Sale',
    location: 'Satellite Town, Block D',
    contact: '0322-7654321',
    area: '5 Marla',
    rooms: '3 Bedrooms, 2 Baths',
    floor: 'Single Story',
    description: 'Newly constructed house with top-quality materials. Solid wood doors, luxury sanitary fittings, marble flooring, and beautiful front elevation. Near main park and commercial area.',
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=600'
    ],
    ownerName: 'Dr. Tariq Mahmood',
    featured: true
  },
  {
    id: 'pr4',
    title: 'Modern 2 Bed Luxury Apartment',
    price: 'PKR 35,000 / month',
    type: 'Apartment',
    purpose: 'Rent',
    location: 'Siddique Chowk, Dhoke Hassu',
    contact: '0301-3456789',
    area: '3 Marla',
    rooms: '2 Bedrooms, TV Lounge',
    floor: '2nd Floor',
    description: 'Fully secure apartment block with elevator and standby generator. Open kitchen, balcony overlooking main road, and designated parking space.',
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=600'
    ],
    ownerName: 'Hassan Shah',
    featured: false
  },
  {
    id: 'pr5',
    title: '3 Marla Commercial Plot for Investment',
    price: 'PKR 4,500,000',
    type: 'Plot',
    purpose: 'Sale',
    location: 'Hazara Colony Road',
    contact: '0312-4448765',
    area: '3 Marla',
    rooms: 'N/A',
    floor: 'Ground',
    description: 'Commercial plot ideal for building shops or storage warehouse. Clear title documents, immediate registry, and all utility connections available on-site.',
    images: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=600'
    ],
    ownerName: 'Major (R) Amjad',
    featured: false
  }
];

export const mockBuySell: BuySellItem[] = [
  {
    id: 'b1',
    title: 'Honda CD 70 Motorcycle - 2022 Model',
    category: 'Other',
    price: 'PKR 95,000',
    condition: 'Excellent (9/10)',
    contact: '0315-9876543',
    image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=400',
    images: [
      'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=400'
    ],
    description: 'Honda CD 70 in excellent condition, completely original body, engine never opened, high fuel average of 60 km/L. Original smart card and registration plate available. Scratchless body, maintained at authorized tuning center.',
    area: 'Dhoke Hassu',
    sellerName: 'Waseem Akram',
    postedTime: '2 hours ago'
  },
  {
    id: 'b2',
    title: 'Samsung Double Door Refrigerator',
    category: 'Electronics',
    price: 'PKR 45,000',
    condition: 'Used - 2 Years (Perfect working condition)',
    contact: '0336-1234789',
    image: 'https://images.unsplash.com/photo-1571175432248-5228b5a7f703?auto=format&fit=crop&q=80&w=400',
    images: [
      'https://images.unsplash.com/photo-1571175432248-5228b5a7f703?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400'
    ],
    description: 'Selling my Samsung No-Frost Double Door refrigerator. Very fast cooling, reliable digital inverter compressor with 8 years warranty remaining. Gas never refilled, completely flawless performance. Best for a small family.',
    area: 'Satellite Town',
    sellerName: 'Zainab Bibi',
    postedTime: '5 hours ago'
  },
  {
    id: 'b3',
    title: 'Wooden Dining Table with 6 Chairs',
    category: 'Furniture',
    price: 'PKR 18,000',
    condition: 'Good',
    contact: '0324-4567890',
    image: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&q=80&w=400',
    images: [
      'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&q=80&w=400'
    ],
    description: 'Solid Sheesham wood dining table with 6 cushion chairs. Normal wear and tear, very strong structures, and elegant design. Polish is in pristine condition. Moving out sale.',
    area: 'Dhoke Hassu',
    sellerName: 'Aslam Khan',
    postedTime: '1 day ago'
  }
];

export const mockBusinesses: BusinessItem[] = [];

export const mockServices = [
  {
    id: 's1',
    title: 'Professional Plumbing & Leakage Repair',
    name: 'Sajid Mahmood',
    category: 'Plumber',
    experience: '8 Years',
    area: 'Dhoke Hassu',
    rating: 4.8,
    availability: 'Available' as const,
    contact: '0312-5553344',
    description: 'All kinds of plumbing installation, repair, and pipe leakage solutions. Expert in gas & water geysers and modern sanitary fitting. Low cost and reliable work guaranteed.',
    image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 's2',
    title: 'UPS, Solar & House Wiring Expert',
    name: 'Amjad Ali',
    category: 'Electrician',
    experience: '10 Years',
    area: 'Dhoke Hassu',
    rating: 4.9,
    availability: 'Available' as const,
    contact: '0333-6667788',
    description: 'Professional electrician specializing in computerized house wiring, ceiling fan installations, UPS and Solar System setup, Inverter AC fitting, and short-circuit troubleshooting.',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 's3',
    title: 'Home & Online Physics & Math Tuition',
    name: 'Sir Kamran Malik',
    category: 'Tutor',
    experience: '5 Years',
    area: 'Satellite Town',
    rating: 4.7,
    availability: 'Available' as const,
    contact: '0300-1112233',
    description: 'Experienced Home and Online tutor offering customized courses for Mathematics, Physics, and Chemistry from class 9th to 12th (Matric, FSc, and O-Levels). Boost your grades with practical examples.',
    image: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 's4',
    title: 'Premium Home Deep Cleaning & Sofa Washing',
    name: 'Aslam Cleaners',
    category: 'Cleaner',
    experience: '3 Years',
    area: 'Dhoke Hassu',
    rating: 4.5,
    availability: 'Available' as const,
    contact: '0321-4449988',
    description: 'Professional deep cleaning services for houses, flats, shops, and offices. Specialized in sofa washing, carpet vacuuming, water tank cleaning, and bathroom hygiene sanitization.',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 's5',
    title: 'Bespoke Wooden Furniture & Door Fitting',
    name: 'Ustad Tariq Carpenter',
    category: 'Carpenter',
    experience: '12 Years',
    area: 'Dhoke Hassu',
    rating: 4.9,
    availability: 'Available' as const,
    contact: '0315-7776655',
    description: 'Master carpenter specializing in modern kitchen cabinets, wooden door designs, bedroom wardrobes, LCD panels, sofa polish, and general furniture repair work in Rawalpindi area.',
    image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 's6',
    title: 'Inverter AC, Refrigerator & Washing Machine Repair',
    name: 'Hassu Tech Technicians',
    category: 'Technician',
    experience: '6 Years',
    area: 'Dhoke Hassu',
    rating: 4.8,
    availability: 'Available' as const,
    contact: '0300-5559876',
    description: 'On-site repair and maintenance for split AC units, gas refilling, cooling problems, refrigerator compressors, automatic washing machines, microwave ovens, and electric water dispensers.',
    image: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 's7',
    title: 'Complete Home Renovation & Wall Painting',
    name: 'Raja Paint & Renovation',
    category: 'Home Repair',
    experience: '9 Years',
    area: 'Dhoke Khabba',
    rating: 4.6,
    availability: 'Busy' as const,
    contact: '0331-5551234',
    description: 'High-quality wall painting, dynamic wallpaper pasting, false ceiling installation, tile/marble fitting, and masonry cement work. Reliable on-time completion for local residents.',
    image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 's8',
    title: 'Bridal Makeup, Facial & Hair Styling',
    name: 'Zoya Bridal Salon',
    category: 'Beauty',
    experience: '4 Years',
    area: 'Dhoke Hassu',
    rating: 4.8,
    availability: 'Available' as const,
    contact: '0322-8884321',
    description: 'Expert parlor services for ladies. Specializing in bridal makeup, party makeup, organic facials, hair dye, wax, manicure/pedicure, and custom mehndi designs. Home-service option available.',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 's9',
    title: 'Bespoke Traditional Shalwar Kameez Tailoring',
    name: 'Ustad Khalid Darzi',
    category: 'Other',
    experience: '15 Years',
    area: 'Dhoke Hassu',
    rating: 4.7,
    availability: 'Busy' as const,
    contact: '0345-9998877',
    description: 'Master tailor offering bespoke fitting for Shalwar Kameez, Kurta Pajama, Waistcoats, and wedding Sherwanis. Precise stitching and timely delivery before Eid or special occasions.',
    image: 'https://images.unsplash.com/photo-1525230071276-4a87f42f469e?auto=format&fit=crop&q=80&w=400'
  }
];

export const mockAlerts: AlertItem[] = [
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
    status: 'Active',
    relatedUpdates: [
      'Repair team arrived at 12:30 PM and started excavating the site.',
      'Replacement valve procured from City Store. Installation begins shortly.',
      'Emergency water tanker service has been requested for affected streets.'
    ]
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
    status: 'Active',
    relatedUpdates: [
      'Street CCTV footage has been shared with the local police post.',
      'Voluntary night patrolling teams are being organized starting tonight at 11:00 PM.'
    ]
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
    status: 'Active',
    relatedUpdates: [
      'Local mosque made general announcements to find Ahmed.',
      'Search parties are currently scanning the Main Park and surrounding residential streets.'
    ]
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
    status: 'Active',
    relatedUpdates: [
      'Excavation complete. Sewerage pipe placement is 50% done.',
      'Traffic warden deployed at Chungi No. 22 intersection to guide commuters.'
    ]
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
    status: 'Active',
    relatedUpdates: [
      'Nullah Lai water level monitored; currently at normal baseline level.',
      'Municipal clean-up crew has finished clearing trash from main drain choke points.'
    ]
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
    status: 'Active',
    relatedUpdates: [
      'Free medicine supplies sponsored by Hamdard Pharmacy arrived today.',
      '3 local volunteer doctors confirmed their participation.'
    ]
  }
];

export const mockEvents: EventItem[] = [
  {
    id: 'e1',
    title: 'Dhoke Hassu Tape Ball Cricket Tournament',
    category: 'Sports',
    date: '2026-07-05',
    startTime: '10:00 AM',
    endTime: '06:00 PM',
    area: 'Satellite Town College Ground',
    description: 'Annual tape-ball cricket tournament featuring top players and teams from Dhoke Hassu, Hazara Colony, and Satellite Town. Matches are 6-over dual eliminations. Refreshments and trophy presentation for finalists. Spectator entry is completely free!',
    coverImage: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=600',
    organizerName: 'Dhoke Hassu Sports Club',
    contactNumber: '0300-1112222',
    interestedCount: 34,
    ticketPrice: 'Free',
    maxAttendees: 200
  },
  {
    id: 'e2',
    title: 'Free Web Development & IT Skills Workshop',
    category: 'Education',
    date: '2026-07-08',
    startTime: '02:00 PM',
    endTime: '05:00 PM',
    area: 'Dhoke Hassu Public School Computer Lab',
    description: 'Learn modern HTML, CSS, Javascript and AI prompting techniques. Best for high school students and young graduates looking to start their digital freelancing career. Led by senior software developers. Certificates of attendance will be awarded.',
    coverImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=600',
    organizerName: 'Rawal Youth Tech Association',
    contactNumber: '0333-4445555',
    interestedCount: 19,
    ticketPrice: 'Free',
    maxAttendees: 40
  },
  {
    id: 'e3',
    title: 'Weekly Quranic Tafseer & Community Dua',
    category: 'Religious',
    date: '2026-07-03',
    startTime: '05:30 PM',
    endTime: '07:30 PM',
    area: 'Jamia Ghausia Mosque Hall',
    description: 'Weekly spiritual program for local community members. Inspiring Tafseer lectures by renowned local Islamic scholars, followed by community prayers, collective Dua for peace and health, and dynamic networking. Dinner (Niaz) will be served to all attendees.',
    coverImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
    organizerName: 'Jamia Masjid Committee',
    contactNumber: '0312-7778888',
    interestedCount: 56,
    ticketPrice: 'Free'
  }
];

export const mockDeals: DealItem[] = [
  {
    id: 'd1',
    title: 'Buy 1 KG Dhoda Halwa, Get 250g Completely Free',
    category: 'Food',
    businessName: 'Siddique Sweets & Bakers',
    description: 'Celebrate this month with our signature, delicious Dhoke Hassu special Dhoda Halwa. Prepared with pure desi ghee, nuts, and organic milk. Buy 1 KG today and receive an extra 250g box absolutely free of charge for your family!',
    area: 'Main Bazar, Dhoke Hassu',
    discountText: 'Buy 1 KG, Get 250g FREE',
    expiryDate: '2026-07-31',
    images: [
      'https://images.unsplash.com/photo-1589118949245-7d38baf380d6?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600'
    ],
    contact: '0312-5559876',
    terms: 'Valid for in-store purchases only. Mention this Dhoke Hassu Connect App offer at the counter before billing. One per customer per day.'
  },
  {
    id: 'd2',
    title: 'Flat 15% Off on All Premium Mobile & Tablet Accessories',
    category: 'Electronics',
    businessName: 'Hamza Mobile & Repair Center',
    description: 'Upgrade your phone safety with high-quality tempered glasses, durable silicon cases, fast chargers, and wireless neckbands. Enjoy flat 15% off across all branded inventory on displaying this app listing!',
    area: 'Chungi No. 22 Road, Dhoke Hassu',
    discountText: 'Flat 15% OFF',
    expiryDate: '2026-08-10',
    images: [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1546054454-aa26e2b734c7?auto=format&fit=crop&q=80&w=600'
    ],
    contact: '0300-1113344',
    terms: 'Offer does not apply on mobile repairs or mobile balance/loads. Valid until stock lasts.'
  },
  {
    id: 'd3',
    title: 'Free Blood Sugar & BP Testing Clinic',
    category: 'Health',
    businessName: 'Al-Shifa Pharmacy & Medical Store',
    description: 'Prioritize your family health! Get completely free Blood Sugar and Blood Pressure examinations with any medicine purchase of PKR 500 or more. Consult our in-house qualified pharmacist for free health advice.',
    area: 'Opposite Government Boys School, Dhoke Hassu',
    discountText: 'FREE Sugar & BP Test',
    expiryDate: '2026-07-25',
    images: [
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1628771065518-0d82f1938462?auto=format&fit=crop&q=80&w=600'
    ],
    contact: '0321-7776543',
    terms: 'Testing is available between 5:00 PM and 9:00 PM daily. Please present the coupon code "SHIFA-DH" from this app.'
  },
  {
    id: 'd4',
    title: 'PKR 200 Discount on Stitching of Your Second Ladies Suit',
    category: 'Services',
    businessName: 'Rawal Boutique & Stitching Center',
    description: 'Get ready for the upcoming wedding season! If you bring two or more unstitched suits for stitching, you will get flat PKR 200 discount on the stitching of the second suit. Premium customized design fit guaranteed by Master Malik!',
    area: 'Street 4, Dhoke Hassu',
    discountText: 'Save PKR 200 On 2nd Suit',
    expiryDate: '2026-07-20',
    images: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1605647540924-852290f6b0d5?auto=format&fit=crop&q=80&w=600'
    ],
    contact: '0333-8889922',
    terms: 'Stitching queue is first-come-first-serve. Advance payment of 50% required. Valid for standard ladies lawn, linen, or cotton stitching.'
  },
  {
    id: 'd5',
    title: 'Save PKR 150 on Sufi Cooking Oil 5 Liter Can',
    category: 'Shopping',
    businessName: 'Al-Hamd General Store & Mart',
    description: 'Exclusive kitchen savings! Purchase Sufi Cooking Oil (5 Liter Can) and get an instant cash discount of PKR 150. Stock your pantry with premium household products at wholesale rates in Dhoke Hassu.',
    area: 'Street 9, Near Jamia Masjid Ghausia, Dhoke Hassu',
    discountText: 'PKR 150 Off Sufi 5L Oil',
    expiryDate: '2026-07-15',
    images: [
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&q=80&w=600'
    ],
    contact: '0345-6667788',
    terms: 'Limited to 2 cans per customer household to ensure fair distribution. No dealers allowed.'
  }
];

export const mockGroups: GroupItem[] = [
  {
    id: 'group-1',
    name: 'Dhoke Hassu Elders Council',
    category: 'Neighborhood',
    area: 'Dhoke Hassu',
    description: 'A platform for the senior elders, respected members, and community heads of Dhoke Hassu to discuss development, resolve neighborhood conflicts, and organize welfare activities.',
    coverImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
    privacy: 'Public',
    memberCount: 38,
    rules: [
      'Respect everyone’s opinions.',
      'Do not post political or partisan propaganda.',
      'Focus strictly on neighborhood development and peace.'
    ],
    admins: ['Zia-ur-Rehman (Union Council President)', 'Bashir Ahmed'],
    creator: 'Zia-ur-Rehman (Union Council President)',
    members: ['Zia-ur-Rehman (Union Council President)', 'Bashir Ahmed', 'Chaudhary Kamran', 'Mehmood Saad'],
    requests: [],
    recentPosts: [
      {
        id: 'gp-1-1',
        author: 'Zia-ur-Rehman (Union Council President)',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120',
        content: 'I have scheduled our monthly meeting this Sunday at 10:00 AM at the UC Office. We will discuss the water supply pipe leakage near Ghausia Mosque.',
        time: '3 hours ago',
        pinned: true
      },
      {
        id: 'gp-1-2',
        author: 'Bashir Ahmed',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
        content: 'Thank you Mr. President. I will make sure the plumbing materials are prepared and ready by Saturday.',
        time: '1 hour ago'
      }
    ]
  },
  {
    id: 'group-2',
    name: 'Dhoke Hassu Cricket League',
    category: 'Sports',
    area: 'Pirwadhai Ground',
    description: 'The official group for all local cricket matches, night tournaments, friendly tape-ball fixtures, and player coordination in UC-1 Rawalpindi.',
    coverImage: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=600',
    privacy: 'Public',
    memberCount: 142,
    rules: [
      'Strictly sportsmanship and fair play.',
      'No abuse, bad language, or physical fights.',
      'All tourney registrations must list player contact numbers.'
    ],
    admins: ['Hamza Mobile', 'Yasir Ali'],
    creator: 'Hamza Mobile',
    members: ['Hamza Mobile', 'Yasir Ali', 'Aslam Khan', 'Adnan Malik'],
    requests: [],
    recentPosts: [
      {
        id: 'gp-2-1',
        author: 'Hamza Mobile',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
        content: 'Registration is now OPEN for the Dhoke Hassu Tape-ball Night Cup! Entry fee is PKR 1000 per team. Winner prize is PKR 15000 cash. Register by calling me directly.',
        time: 'Yesterday',
        pinned: true
      }
    ]
  },
  {
    id: 'group-3',
    name: 'Rawalpindi Volunteers Union',
    category: 'Volunteers',
    area: 'UC-1 Zone',
    description: 'Connecting young volunteers of Dhoke Hassu, Pirwadhai, and nearby areas for blood donation drives, street cleaning, food distribution, and emergency response.',
    coverImage: 'https://images.unsplash.com/photo-1559027615-cd448753230d?auto=format&fit=crop&q=80&w=600',
    privacy: 'Public',
    memberCount: 75,
    rules: [
      'Be ready to help when called.',
      'No personal ads or sales.',
      'Coordinate respectfully with local NGOs.'
    ],
    admins: ['Ayesha Siddiqui'],
    creator: 'Ayesha Siddiqui',
    members: ['Ayesha Siddiqui', 'Zia-ur-Rehman (Union Council President)', 'Chaudhary Kamran'],
    requests: [],
    recentPosts: [
      {
        id: 'gp-3-1',
        author: 'Ayesha Siddiqui',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120',
        content: 'EMERGENCY: We need 2 bottles of O-Negative Blood for a patient at Holy Family Hospital Rawalpindi. If anyone is available to donate immediately, please contact me on 0333-1234567!',
        time: '5 hours ago',
        pinned: true
      }
    ]
  },
  {
    id: 'group-4',
    name: 'Bashir Ahmed Hardware Market',
    category: 'Business',
    area: 'Dhoke Hassu Street 4',
    description: 'An exchange group for all small hardware owners, builders, contractors, and handymen in Dhoke Hassu to share tool availability, materials prices, and wholesale supply deals.',
    coverImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=600',
    privacy: 'Public',
    memberCount: 29,
    rules: [
      'Keep it professional and hardware/construction related.',
      'Always specify prices clearly.'
    ],
    admins: ['Bashir Ahmed'],
    creator: 'Bashir Ahmed',
    members: ['Bashir Ahmed', 'Hamza Mobile', 'Siddique Sweets'],
    requests: [],
    recentPosts: []
  },
  {
    id: 'group-5',
    name: 'Dhoke Hassu Mosque Committee',
    category: 'Religious',
    area: 'Jamia Masjid Ghausia',
    description: 'Official group for coordinating masjid donations, upkeep, religious events, Milad/Juma announcements, and Quran classes for children.',
    coverImage: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&q=80&w=600',
    privacy: 'Private',
    memberCount: 55,
    rules: [
      'Strictly religious and masjid coordination topics.',
      'No sectarian discussions or debates.'
    ],
    admins: ['Zia-ur-Rehman (Union Council President)', 'Maulana Farhan'],
    creator: 'Zia-ur-Rehman (Union Council President)',
    members: ['Zia-ur-Rehman (Union Council President)', 'Maulana Farhan', 'Bashir Ahmed'],
    requests: ['Ayesha Siddiqui'],
    recentPosts: [
      {
        id: 'gp-5-1',
        author: 'Maulana Farhan',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
        content: 'Assalamu Alaikum. Daily Quran Classes for kids are restarting from tomorrow after Asr prayer. Please register your kids names with the Masjid office.',
        time: '2 days ago',
        pinned: true
      }
    ]
  }
];



