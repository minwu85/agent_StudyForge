import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Documents } from './pages/Documents/Documents'
import { Home } from './pages/Home/Home'
import { Progress } from './pages/Progress/Progress'
import { Quiz } from './pages/Quiz/Quiz'
import { QuizSetup } from './pages/QuizSetup/QuizSetup'
import { Results } from './pages/Results/Results'
import { Study } from './pages/Study/Study'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/study" element={<Study />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/quiz/setup" element={<QuizSetup />} />
          <Route path="/quiz/:quizId" element={<Quiz />} />
          <Route path="/results/:quizId" element={<Results />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
