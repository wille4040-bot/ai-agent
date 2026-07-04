import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Start from './pages/Start.jsx'
import Bokning from './pages/Bokning.jsx'
import Admin from './pages/admin/Admin.jsx'

// Adresserna i appen:
//   /            -> enkel startsida
//   /admin       -> inloggning + adminpanel för företagsägaren
//   /frisor-lisa -> bokningssidan för företaget med den "sluggen"
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Start />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/:slug" element={<Bokning />} />
      </Routes>
    </BrowserRouter>
  )
}
