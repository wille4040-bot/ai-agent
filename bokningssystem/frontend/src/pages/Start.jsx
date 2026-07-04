import { Link } from 'react-router-dom'

// Enkel startsida. I Fas 2 blir detta en riktig säljsida
// med registrering för nya företag.
export default function Start() {
  return (
    <div className="sida">
      <header className="sidhuvud">
        <h1>Bokningssystemet</h1>
        <p className="dampad">Onlinebokning för tjänsteföretag – öppet dygnet runt.</p>
      </header>
      <div className="kort">
        <h2>Testa demon</h2>
        <p className="dampad">Så här ser bokningssidan ut för ett anslutet företag:</p>
        <Link className="knapp primar lank-knapp" to="/frisor-lisa">
          Boka tid hos Frisör Lisa
        </Link>
        <Link className="knapp sekundar lank-knapp" to="/admin">
          Logga in som företagsägare
        </Link>
      </div>
    </div>
  )
}
