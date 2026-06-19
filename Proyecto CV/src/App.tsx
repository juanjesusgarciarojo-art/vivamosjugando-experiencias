import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { Home } from './pages/Home';
import { AdminDashboard } from './pages/AdminDashboard';
import { Prueba1 } from './pages/Prueba1';
import { Prueba2 } from './pages/Prueba2';
import { Prueba3 } from './pages/Prueba3';
import { Prueba4 } from './pages/Prueba4';
import { Victoria } from './pages/Victoria';
import { Radar } from './components/Radar';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/registro" element={<Home />} />
          <Route path="/prueba1" element={<Prueba1 />} />
          <Route path="/prueba2" element={<Prueba2 />} />
          <Route path="/prueba3" element={<Prueba3 />} />
          <Route path="/prueba4" element={<Prueba4 />} />
          <Route path="/radar" element={<Radar />} />
          <Route path="/victoria" element={<Victoria />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
