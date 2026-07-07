import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Home from './pages/Home.jsx'
import AuthPage from './pages/AuthPage.jsx'
import Profile from './pages/Profile.jsx'
import Annonser from './pages/Annonser.jsx'
import AnnonsDetalj from './pages/AnnonsDetalj.jsx'
import NyAnnons from './pages/NyAnnons.jsx'
import MinaBokningar from './pages/MinaBokningar.jsx'
import MinaUthyrningar from './pages/MinaUthyrningar.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="logga-in" element={<AuthPage />} />
        <Route path="annonser" element={<Annonser />} />
        <Route path="annonser/:id" element={<AnnonsDetalj />} />
        <Route
          path="ny-annons"
          element={
            <ProtectedRoute>
              <NyAnnons />
            </ProtectedRoute>
          }
        />
        <Route
          path="mina-bokningar"
          element={
            <ProtectedRoute>
              <MinaBokningar />
            </ProtectedRoute>
          }
        />
        <Route
          path="mina-uthyrningar"
          element={
            <ProtectedRoute>
              <MinaUthyrningar />
            </ProtectedRoute>
          }
        />
        <Route
          path="profil"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  )
}
