export type Listing = { id: number; name: string; kind: 'Produce' | 'Equipment' | 'Services'; location: string; price: string; unit: string; quantity: string; label: string; icon: string; tone: string; seller: string; verified: boolean; };
export type CommunityPost = { id: number; author: string; role: string; district: string; time: string; avatar: string; topic: string; text: string; likes: number; replies: number; };

export const listings: Listing[] = [
  { id: 1, name: 'Fresh red tomatoes', kind: 'Produce', location: 'Nashik, Maharashtra', price: '₹1,850', unit: '/ quintal', quantity: '4.5 tonnes', label: 'Just harvested', icon: '🍅', tone: 'peach', seller: 'Green Valley Farms', verified: true },
  { id: 2, name: 'Premium red onions', kind: 'Produce', location: 'Lasalgaon, Maharashtra', price: '₹2,200', unit: '/ quintal', quantity: '8 tonnes', label: 'Bulk supply', icon: '🧅', tone: 'lavender', seller: 'Satvik Agro', verified: true },
  { id: 3, name: 'Soybean, grade A', kind: 'Produce', location: 'Latur, Maharashtra', price: '₹4,350', unit: '/ quintal', quantity: '12 tonnes', label: 'New listing', icon: '🌾', tone: 'sage', seller: 'Sahyadri FPO', verified: true },
  { id: 4, name: 'Tractor with rotavator', kind: 'Equipment', location: 'Pune, Maharashtra', price: '₹900', unit: '/ hour', quantity: 'Rental', label: 'Available', icon: '🚜', tone: 'yellow', seller: 'Patil Farm Services', verified: false },
  { id: 5, name: 'Farm produce transport', kind: 'Services', location: 'Ahmednagar, Maharashtra', price: 'On request', unit: '', quantity: '2–8 tonne trucks', label: 'Local service', icon: '🚚', tone: 'blue', seller: 'Krushi Logistics', verified: true },
  { id: 6, name: 'Green chillies', kind: 'Produce', location: 'Kolhapur, Maharashtra', price: '₹3,100', unit: '/ quintal', quantity: '2 tonnes', label: 'Fresh lot', icon: '🌶️', tone: 'mint', seller: 'Mahadev Farms', verified: false }
];

export const posts: CommunityPost[] = [
  { id: 101, author: 'Anaya Kulkarni', role: 'Tomato grower', district: 'Pune', time: '2h ago', avatar: 'AK', topic: 'Crop care', text: 'Some leaves on my tomato plants are developing yellow patches after recent rain. What should I check before taking action?', likes: 24, replies: 8 },
  { id: 102, author: 'Sahyadri Farmers Group', role: 'Verified FPO', district: 'Nashik', time: '5h ago', avatar: 'SF', topic: 'Market discussion', text: 'We are planning a collective onion harvest this week. Anyone have advice on grading and pre-sale quality checks?', likes: 42, replies: 15 },
  { id: 103, author: 'Rahul Deshmukh', role: 'Farmer', district: 'Latur', time: 'Yesterday', avatar: 'RD', topic: 'Water management', text: 'We saved water this season by dividing the field into smaller irrigation zones. Happy to share what worked for us.', likes: 31, replies: 6 }
];

export const mandiMarkets = [
 { market: 'Pune', crop: 'Tomato', min: '₹1,400', max: '₹2,050', avg: '₹1,750', trend: '+3.8%' },
 { market: 'Lasalgaon', crop: 'Onion', min: '₹1,900', max: '₹2,450', avg: '₹2,170', trend: '+1.6%' },
 { market: 'Latur', crop: 'Soybean', min: '₹4,080', max: '₹4,550', avg: '₹4,320', trend: '−0.8%' },
 { market: 'Kolhapur', crop: 'Chilli', min: '₹2,700', max: '₹3,400', avg: '₹3,100', trend: '+2.4%' }
];
