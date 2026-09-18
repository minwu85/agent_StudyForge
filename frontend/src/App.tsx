import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Home } from './pages/Home/Home'
import { Quiz } from './pages/Quiz/Quiz'
import { QuizSetup } from './pages/QuizSetup/QuizSetup'
import { Results } from './pages/Results/Results'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/quiz/setup" element={<QuizSetup />} />
          <Route path="/quiz/:quizId" element={<Quiz />} />
          <Route path="/results/:quizId" element={<Results />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
