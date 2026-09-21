import { Routes, Route } from 'react-router-dom'

import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Cabins from './pages/Cabins.jsx'
import CabinDetail from './pages/CabinDetail.jsx'
import Equipment from './pages/Equipment.jsx'
import About from './pages/About.jsx'
import ContactFaq from './pages/ContactFaq.jsx'
import Booking from './pages/Booking.jsx'
import BookingSuccess from './pages/BookingSuccess.jsx'
import BookingCancelled from './pages/BookingCancelled.jsx'
import FishingLanding from './pages/FishingLanding.jsx'
import DogsLanding from './pages/DogsLanding.jsx'
import PrivacyPolicy from './pages/PrivacyPolicy.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="cabins" element={<Cabins />} />
        <Route path="cabins/:id" element={<CabinDetail />} />
        <Route path="equipment" element={<Equipment />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<ContactFaq />} />
        <Route path="booking" element={<Booking />} />
        <Route path="booking/success" element={<BookingSuccess />} />
        <Route path="booking/cancelled" element={<BookingCancelled />} />
        <Route path="angeln" element={<FishingLanding />} />
        <Route path="hunde" element={<DogsLanding />} />
        <Route path="datenschutz" element={<PrivacyPolicy />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
