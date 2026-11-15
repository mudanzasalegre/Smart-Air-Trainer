import {createRoot} from 'react-dom/client';
import App from './App';
import {DialogProvider} from './Dialog';
import './style.css';
import './usability.css';
createRoot(document.getElementById('root')!).render(<DialogProvider><App/></DialogProvider>);
if(import.meta.env.PROD&&'serviceWorker' in navigator)window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{});});
