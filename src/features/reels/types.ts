export type Spec = { k: string; v: string }
export type Listing = {
  id: string; sellerInit: string; sellerName: string; sellerCat: string; verified: boolean
  title: string; price: string; oldPrice?: string; discount?: string; negotiable: boolean
  location: string; condition: string; views: string; posted: string; favCount: string
  delivery: boolean; warranty?: string; aspectLabel: string; aspectRatio: string
  videoUrl: string
  // TODO(contract): public seller phone for Chat/Call. Confirm whether it ships
  // on the feed or is read from the detail/user endpoint.
  phone?: string
  descShort: string; descFull: string; specs: Spec[]; tags: string[]
  sellerRating: string; sellerReviews: string; sellerListings: string; sellerResp: string; sellerSince: string
}
