// Praktisk anreseinformation per stuga (adress, vägbeskrivning, incheckningstid,
// nyckelöverlämning). Platshållartext på tyska – ersätt med riktiga uppgifter.

export type ArrivalInfo = {
  address: string
  directions: string
  checkInTime: string
  keyHandover: string
}

export const ARRIVAL: Record<string, ArrivalInfo> = {
  seeblick: {
    address: 'Seeblick 1, 573 96 Tranås-Sommen, Schweden',
    directions:
      'Von Tranås der Straße 131 Richtung Sommen folgen, nach der Kirche rechts abbiegen und den Schildern "Seeblick" folgen (ca. 4 km).',
    checkInTime: 'ab 15:00 Uhr',
    keyHandover:
      'Der Schlüssel liegt in einem Schlüsseltresor an der Haustür. Den Code erhalten Sie am Anreisetag per SMS.',
  },
  waldhuette: {
    address: 'Waldweg 7, 573 97 Sommen, Schweden',
    directions:
      'Von Sommen der Straße 596 folgen, am Waldrand links auf den Schotterweg abbiegen, die Hütte liegt am Ende des Weges.',
    checkInTime: 'ab 16:00 Uhr',
    keyHandover:
      'Unsere Betreuerin vor Ort übergibt Ihnen den Schlüssel persönlich. Bitte melden Sie sich am Anreisetag telefonisch.',
  },
  sommenblick: {
    address: 'Sommenblick 12, 573 98 Sommen, Schweden',
    directions:
      'Von der E4 Abfahrt Tranås, dann Richtung Sommen; nach dem Ort den Schildern "Sommenblick" folgen (ca. 6 km, letzte 500 m Schotter).',
    checkInTime: 'ab 15:00 Uhr',
    keyHandover:
      'Der Schlüssel liegt in einem Schlüsseltresor rechts neben der Terrassentür. Den Code erhalten Sie am Anreisetag per E-Mail.',
  },
}
