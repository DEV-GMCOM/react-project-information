// import React from 'react'
// import ReactDOM from 'react-dom/client'
// import App from './App'
// import './styles/index.css'

// ReactDOM.createRoot(document.getElementById('root')!).render(
//     <React.StrictMode>
//         <App />
//     </React.StrictMode>,
// )


import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/index.css'

// 환경변수에서 basename 가져오기
const basename = import.meta.env.VITE_BASE_PATH || '/information'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
     {/*<BrowserRouter basename={basename}>*/}
    <BrowserRouter>
    <App />
    </BrowserRouter>
  </React.StrictMode>
)