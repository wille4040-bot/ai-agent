// Karta via OpenStreetMap-inbäddning (ingen API-nyckel, inga extra beroenden).
// En liten bounding box runt koordinaten med en markör på platsen.
export default function CabinMap({ coords, title }) {
  if (!coords) return null
  const { lat, lng } = coords
  const d = 0.02 // ~2 km ram
  const bbox = [lng - d, lat - d, lng + d, lat + d].join(',')
  const src =
    `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}` +
    `&layer=mapnik&marker=${lat},${lng}`
  const link = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=13/${lat}/${lng}`

  return (
    <div className="map">
      <iframe
        title={title || 'Map'}
        className="map-frame"
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <a className="map-link" href={link} target="_blank" rel="noreferrer">
        OpenStreetMap ↗
      </a>
    </div>
  )
}
