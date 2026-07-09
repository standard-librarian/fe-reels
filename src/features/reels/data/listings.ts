import type { Listing } from '../types'

const common = {
  verified: true,
  negotiable: true,
  delivery: false,
  aspectLabel: '9:16 · VIDEO',
  aspectRatio: '9 / 16',
  sellerRating: '4.8',
  sellerReviews: 'Verified',
  sellerListings: 'Active',
  sellerResp: 'Usually responds quickly',
  sellerSince: '4Sale seller',
}

// Sanitized snapshot of public, video-enabled motor listings from the
// production advertisement index. Contact and account data are excluded.
export const listings: Listing[] = [
  {
    ...common,
    id: '20999479', sellerInit: '4S', sellerName: '4Sale Seller', sellerCat: 'Land Cruiser',
    title: '2009 Toyota Land Cruiser Pickup', price: '3,200', location: 'Kuwait',
    condition: 'Used · Inspection recommended', views: 'New', posted: 'Today', favCount: '0',
    videoUrl: 'https://media.q84sale.com/videos/1783776674450715564.mp4',
    descShort: '2009 Toyota Land Cruiser Pickup (Shas) in original paint, with some notes on the body.',
    descFull: '2009 Toyota Land Cruiser Pickup (Shas) in original paint. The seller notes that there are some observations on the body. Inspect the vehicle and confirm all details before purchase.',
    specs: [{k:'Year',v:'2009'},{k:'Make',v:'Toyota'},{k:'Model',v:'Land Cruiser Pickup'},{k:'Location',v:'Kuwait'}],
    tags: ['Toyota','LandCruiser','Pickup','Motors'],
  },
  {
    ...common,
    id: '20999442', sellerInit: '4S', sellerName: '4Sale Seller', sellerCat: 'Land Cruiser',
    title: '2024 Land Cruiser GXR — Agency Condition', price: '19,200', location: 'Ahmadi, Kuwait',
    condition: 'Used · Agency condition', views: 'New', posted: 'Today', favCount: '0', warranty: 'Seller states agency condition',
    videoUrl: 'https://media.q84sale.com/videos/1783776549505425234.mp4',
    descShort: '2024 Land Cruiser GXR without turbo, driven 55,000 km and described as accident-free with agency paint.',
    descFull: '2024 Land Cruiser GXR without turbo. The listing states 55,000 km, agency condition, accident-free inspection, and agency paint. Verify mileage and condition during inspection.',
    specs: [{k:'Year',v:'2024'},{k:'Mileage',v:'55,000 km'},{k:'Model',v:'Land Cruiser GXR'},{k:'Location',v:'Ahmadi'}],
    tags: ['Toyota','LandCruiser','GXR','SUV'],
  },
  {
    ...common,
    id: '20999118', sellerInit: '4S', sellerName: '4Sale Seller', sellerCat: 'BMW Motorbikes',
    title: '2015 BMW S1000R', price: '2,500', location: 'Zahra, Hawalli',
    condition: 'Used · Excellent', views: 'New', posted: 'Today', favCount: '0',
    videoUrl: 'https://media.q84sale.com/videos/9280bbed-5641-4856-90bd-b1a621ab34cf.mp4',
    descShort: 'BMW S1000R with 24,000 km, recent full service, new tyres, and Rizoma, Wunderlich and Öhlins upgrades.',
    descFull: '2015 BMW S1000R with 24,000 km. The public listing describes a major service at 19,500 km, a recent full service, new tyres, agency parts, and Rizoma, Wunderlich, carbon and Öhlins upgrades.',
    specs: [{k:'Year',v:'2015'},{k:'Mileage',v:'24,000 km'},{k:'Make',v:'BMW'},{k:'Color',v:'Black'}],
    tags: ['BMW','S1000R','Motorbike','Performance'],
  },
  {
    ...common,
    id: '20999059', sellerInit: '4S', sellerName: '4Sale Seller', sellerCat: 'Grand Cherokee',
    title: '2002 Jeep Grand Cherokee 4WD', price: '750', location: 'Kuwait City, Kuwait',
    condition: 'Used · Maintained', views: 'New', posted: 'Today', favCount: '0',
    videoUrl: 'https://media.q84sale.com/videos/1783772550676478590.mp4',
    descShort: 'Grand Cherokee 4WD with 293,580 km and recently replaced suspension, shock absorbers, radiator and electric fan.',
    descFull: '2002 Jeep Grand Cherokee 4WD with 293,580 km at publication. The seller reports replacement of the suspension system, shock absorbers, radiator, electric fan and driveshaft.',
    specs: [{k:'Year',v:'2002'},{k:'Mileage',v:'293,580 km'},{k:'Drive',v:'4WD'},{k:'Interior',v:'Beige'}],
    tags: ['Jeep','GrandCherokee','4WD','SUV'],
  },
  {
    ...common,
    id: '20998999', sellerInit: '4S', sellerName: '4Sale Seller', sellerCat: 'Nissan Patrol',
    title: '2026 Nissan Patrol Titanium Plus', price: '26,800', location: 'Ardiya, Farwaniyah',
    condition: 'New · Zero mileage', views: 'New', posted: 'Today', favCount: '0', warranty: 'Al-Babtain imported', negotiable: false,
    videoUrl: 'https://media.q84sale.com/videos/1783579344563514196.mp4',
    descShort: '2026 Patrol Titanium Plus Twin Turbo with diamond seats, highest trim, Al-Babtain import and zero mileage.',
    descFull: '2026 Nissan Patrol Titanium Plus Twin Turbo. The public listing describes the highest trim with diamond seats, Al-Babtain import and zero mileage, with a final asking price of KD 26,800.',
    specs: [{k:'Year',v:'2026'},{k:'Mileage',v:'0 km'},{k:'Engine',v:'Twin Turbo'},{k:'Interior',v:'Tan'}],
    tags: ['Nissan','Patrol','TitaniumPlus','New'],
  },
]

export const related = listings.slice(1).map(listing => listing.title)
