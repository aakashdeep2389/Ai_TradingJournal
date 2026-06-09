import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import { useTrades, useRules, useProfile, useScreenshots } from './hooks/useData';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TradeJournal from './pages/TradeJournal';
import RulesTracker from './pages/RulesTracker';
import Analytics from './pages/Analytics';
import AICoach from './pages/AICoach';
import Gallery from './pages/Gallery';
import Reports from './pages/Reports';
import UserProfile from './pages/UserProfile';

function AppContent() {
  const { trades, addTrade, updateTrade, deleteTrade } = useTrades();
  const { rules, upsertRule } = useRules();
  const { profile, updateProfile } = useProfile();
  const { screenshots, addScreenshot, deleteScreenshot } = useScreenshots();

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard trades={trades} rules={rules} />} />
        <Route path="/journal" element={<TradeJournal trades={trades} addTrade={addTrade} updateTrade={updateTrade} deleteTrade={deleteTrade} />} />
        <Route path="/rules" element={<RulesTracker rules={rules} upsertRule={upsertRule} />} />
        <Route path="/analytics" element={<Analytics trades={trades} />} />
        <Route path="/coach" element={<AICoach trades={trades} rules={rules} />} />
        <Route path="/gallery" element={<Gallery screenshots={screenshots} addScreenshot={addScreenshot} deleteScreenshot={deleteScreenshot} />} />
        <Route path="/reports" element={<Reports trades={trades} />} />
        <Route path="/profile" element={<UserProfile profile={profile} updateProfile={updateProfile} trades={trades} rules={rules} />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}
