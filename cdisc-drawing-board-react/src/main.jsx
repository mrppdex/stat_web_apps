import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { ReactFlowProvider } from '@xyflow/react'

ReactDOM.createRoot(document.getElementById('root')).render(
  // StrictMode can cause issues with jsPlumb initialization (double init), 
  // but let's try with it first. If issues arise, we can remove it.
  <React.StrictMode>
    <ReactFlowProvider>
      <App />
    </ReactFlowProvider>
  </React.StrictMode>,
)
