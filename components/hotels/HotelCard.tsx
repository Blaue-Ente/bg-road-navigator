interface HotelCardProps {
  name: string;
  stars: number;
  priceRange: string; // e.g., "€€", "€€€"
  distanceKm: number;
  amenities: string[];
  bookingLink: string;
  imageUrl?: string;
}

export function HotelCard({ name, stars, priceRange, distanceKm, amenities, bookingLink, imageUrl }: HotelCardProps) {
  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-36 object-cover"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      )}
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold">{name}</h3>
            <div className="flex items-center gap-1 mt-1">
              {Array.from({ length: stars }).map((_, i) => (
                <span key={i} className="text-yellow-400">★</span>
              ))}
              <span className="text-sm text-gray-400 ml-2">{priceRange}</span>
            </div>
          </div>
          <span className="text-sm text-blue-400 bg-blue-600/20 px-2 py-1 rounded">
            {distanceKm.toFixed(1)} км
          </span>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {amenities.map((amenity) => (
            <span key={amenity} className="px-2 py-0.5 bg-gray-800 text-xs rounded text-gray-300">
              {amenity}
            </span>
          ))}
        </div>

        <a
          href={bookingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2 px-3 bg-blue-600/20 text-blue-400 rounded text-center hover:bg-blue-600/30 transition block"
        >
          Резервирай на Booking.com
        </a>
      </div>
    </div>
  );
}