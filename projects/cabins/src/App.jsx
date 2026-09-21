import { Routes, Route } from 'react-router-dom'

import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Cabins from './pages/Cabins.jsx'
import CabinDetail from './pages/CabinDetail.jsx'
import Equipment from './pages/Equipment.jsx'
import About from './pages/About.jsx'
import ContactFaq from './pages/ContactFaq.jsx'
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
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
