import React, { lazy } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'

const HomePage = lazy(() => import('../pages/HomePage'))
const WorkPage = lazy(() => import('../pages/WorkPage'))
const ProjectsPage = lazy(() => import('../pages/ProjectsPage'))
const LifePage = lazy(() => import('../pages/LifePage'))
const EducationPage = lazy(() => import('../pages/EducationPage'))

export default function AppRoutes() {
  const location = useLocation()

  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<HomePage />} />
      <Route path="/work" element={<WorkPage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/life" element={<LifePage />} />
      <Route path="/education" element={<EducationPage />} />
    </Routes>
  )
}