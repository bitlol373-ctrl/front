import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Watch from './pages/Watch'
import Upload from './pages/Upload'
import Anime from './pages/Anime'
import Profile from './pages/Profile'
import Layout from './ui/Layout'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/watch/:episodeId" element={<Watch />} />
        <Route path="/upload/:episodeId" element={<Upload />} />
        <Route path="/anime/:animeId" element={<Anime />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Layout>
  )
}
