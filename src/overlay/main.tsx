import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { Overlay } from './Overlay'

const root = document.getElementById('root')
if (!root) throw new Error('No #root element found')

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <Overlay />
  </React.StrictMode>
)
